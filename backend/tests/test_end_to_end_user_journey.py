import pytest
from fastapi import status
from starlette.websockets import WebSocketDisconnect


def create_user(client, username: str, display_name: str) -> dict:
    response = client.post(
        '/api/v1/users',
        json={'username': username, 'display_name': display_name},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def create_channel(client, name: str, topic: str | None = None) -> dict:
    payload = {'name': name}
    if topic is not None:
        payload['topic'] = topic

    response = client.post('/api/v1/channels', json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def add_member(client, channel_id: str, user_id: str) -> dict:
    response = client.post(
        f'/api/v1/channels/{channel_id}/members',
        json={'user_id': user_id},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def test_e2e_happy_path_user_channel_chat_history_and_presence(client) -> None:
    user = create_user(client, 'alice', 'Alice')
    channel = create_channel(client, 'team-sync', 'Daily coordination')
    add_member(client, channel['id'], user['id'])

    users_response = client.get('/api/v1/users')
    assert users_response.status_code == status.HTTP_200_OK
    assert any(item['id'] == user['id'] for item in users_response.json())

    channels_response = client.get('/api/v1/channels')
    assert channels_response.status_code == status.HTTP_200_OK
    assert any(item['id'] == channel['id'] for item in channels_response.json())

    members_response = client.get(f"/api/v1/channels/{channel['id']}/members")
    assert members_response.status_code == status.HTTP_200_OK
    assert any(item['user_id'] == user['id'] for item in members_response.json())

    empty_presence = client.get(f"/api/v1/realtime/channels/{channel['id']}/presence")
    assert empty_presence.status_code == status.HTTP_200_OK
    assert empty_presence.json()['online_count'] == 0

    with client.websocket_connect(
        f"/api/v1/realtime/ws/channels/{channel['id']}?user_id={user['id']}"
    ) as websocket:
        first_event = websocket.receive_json()
        assert first_event['type'] == 'presence'
        assert first_event['online_count'] == 1
        assert user['id'] in first_event['online_user_ids']

        second_event = websocket.receive_json()
        assert second_event['type'] == 'system'
        assert 'joined channel' in second_event['detail']

        connected_presence = client.get(f"/api/v1/realtime/channels/{channel['id']}/presence")
        assert connected_presence.status_code == status.HTTP_200_OK
        assert connected_presence.json()['online_count'] == 1

        websocket.send_json({'type': 'ping'})
        pong_event = websocket.receive_json()
        assert pong_event['type'] == 'pong'

        websocket.send_json({'type': 'message', 'body': 'hello from websocket'})
        message_event = websocket.receive_json()
        assert message_event['type'] == 'message'
        assert message_event['body'] == 'hello from websocket'
        assert message_event['author_id'] == user['id']

    fallback_message_response = client.post(
        f"/api/v1/channels/{channel['id']}/messages",
        json={'author_id': user['id'], 'body': 'hello from rest fallback'},
    )
    assert fallback_message_response.status_code == status.HTTP_201_CREATED

    history_response = client.get(f"/api/v1/channels/{channel['id']}/messages")
    assert history_response.status_code == status.HTTP_200_OK
    history_payload = history_response.json()
    assert len(history_payload) == 2
    assert history_payload[0]['body'] == 'hello from websocket'
    assert history_payload[1]['body'] == 'hello from rest fallback'

    disconnected_presence = client.get(f"/api/v1/realtime/channels/{channel['id']}/presence")
    assert disconnected_presence.status_code == status.HTTP_200_OK
    assert disconnected_presence.json()['online_count'] == 0


def test_e2e_error_path_duplicates_membership_guards_and_ws_membership_policy(client) -> None:
    user = create_user(client, 'bob', 'Bob')
    duplicate_user_response = client.post(
        '/api/v1/users',
        json={'username': 'bob', 'display_name': 'Bobby'},
    )
    assert duplicate_user_response.status_code == status.HTTP_409_CONFLICT
    assert duplicate_user_response.json()['detail'] == 'Username already exists'

    channel = create_channel(client, 'incidents', 'Incident room')
    duplicate_channel_response = client.post('/api/v1/channels', json={'name': 'incidents'})
    assert duplicate_channel_response.status_code == status.HTTP_409_CONFLICT
    assert duplicate_channel_response.json()['detail'] == 'Channel name already exists'

    add_member(client, channel['id'], user['id'])
    duplicate_member_response = client.post(
        f"/api/v1/channels/{channel['id']}/members",
        json={'user_id': user['id']},
    )
    assert duplicate_member_response.status_code == status.HTTP_409_CONFLICT
    assert duplicate_member_response.json()['detail'] == 'User is already a member'

    outsider = create_user(client, 'carol', 'Carol')

    with pytest.raises(WebSocketDisconnect) as websocket_error:
        with client.websocket_connect(
            f"/api/v1/realtime/ws/channels/{channel['id']}?user_id={outsider['id']}"
        ) as websocket:
            websocket.receive_json()

    assert websocket_error.value.code == status.WS_1008_POLICY_VIOLATION

    forbidden_message_response = client.post(
        f"/api/v1/channels/{channel['id']}/messages",
        json={'author_id': outsider['id'], 'body': 'forbidden message'},
    )
    assert forbidden_message_response.status_code == status.HTTP_403_FORBIDDEN
    assert forbidden_message_response.json()['detail'] == 'User is not a channel member'
