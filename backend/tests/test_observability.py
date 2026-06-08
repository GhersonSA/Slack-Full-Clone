from fastapi import status


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


def test_health_response_contains_generated_request_id(client) -> None:
    response = client.get('/api/v1/health')

    assert response.status_code == status.HTTP_200_OK
    request_id = response.headers.get('X-Request-ID')
    assert request_id is not None
    assert len(request_id.strip()) > 0


def test_request_id_header_is_echoed_back(client) -> None:
    response = client.get('/api/v1/health', headers={'X-Request-ID': 'req-observability-123'})

    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get('X-Request-ID') == 'req-observability-123'


def test_http_errors_include_request_id_in_body_and_headers(client) -> None:
    user = create_user(client, 'observer', 'Observer')
    channel = create_channel(client, 'observability')

    response = client.post(
        f"/api/v1/channels/{channel['id']}/messages",
        json={'author_id': user['id'], 'body': 'forbidden without membership'},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()['detail'] == 'User is not a channel member'
    assert 'request_id' in response.json()
    assert response.json()['request_id'] == response.headers.get('X-Request-ID')


def test_validation_errors_include_request_id_in_body_and_headers(client) -> None:
    response = client.get('/api/v1/users/not-a-uuid')

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    payload = response.json()
    assert isinstance(payload.get('detail'), list)
    assert payload.get('request_id') == response.headers.get('X-Request-ID')
