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


def test_rest_message_fallback_requires_membership(client) -> None:
    user = create_user(client, 'gherson', 'Gherson')
    channel = create_channel(client, 'general')

    response = client.post(
        f"/api/v1/channels/{channel['id']}/messages",
        json={'author_id': user['id'], 'body': 'hello fallback'},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()['detail'] == 'User is not a channel member'


def test_rest_message_fallback_persists_and_lists_messages(client) -> None:
    user = create_user(client, 'andrea', 'Andrea')
    channel = create_channel(client, 'engineering', 'Builds')
    add_member(client, channel['id'], user['id'])

    create_response = client.post(
        f"/api/v1/channels/{channel['id']}/messages",
        json={'author_id': user['id'], 'body': 'message through rest'},
    )

    assert create_response.status_code == status.HTTP_201_CREATED
    created_message = create_response.json()
    assert created_message['body'] == 'message through rest'
    assert created_message['author_id'] == user['id']

    list_response = client.get(f"/api/v1/channels/{channel['id']}/messages")
    assert list_response.status_code == status.HTTP_200_OK
    messages = list_response.json()
    assert len(messages) == 1
    assert messages[0]['id'] == created_message['id']


def test_websocket_requires_membership(client) -> None:
    user = create_user(client, 'maria', 'Maria')
    channel = create_channel(client, 'product')

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(
            f"/api/v1/realtime/ws/channels/{channel['id']}?user_id={user['id']}"
        ) as websocket:
            websocket.receive_json()

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION


def test_websocket_member_can_connect_and_broadcast_message(client) -> None:
    user = create_user(client, 'pablo', 'Pablo')
    channel = create_channel(client, 'random')
    add_member(client, channel['id'], user['id'])

    with client.websocket_connect(
        f"/api/v1/realtime/ws/channels/{channel['id']}?user_id={user['id']}"
    ) as websocket:
        joined_event = websocket.receive_json()
        assert joined_event['type'] == 'system'

        websocket.send_json({'type': 'message', 'body': 'hello websocket'})
        message_event = websocket.receive_json()

    assert message_event['type'] == 'message'
    assert message_event['body'] == 'hello websocket'
    assert message_event['author_id'] == user['id']
