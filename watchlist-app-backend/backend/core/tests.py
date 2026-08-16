from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from core.models import Media


class MediaAPITestCase(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='testuser1', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')

        # Obtain JWT token for user1
        response = self.client.post('/api/token/', {'username': 'testuser1', 'password': 'password123'})
        self.token1 = response.data['access']

        # Obtain JWT token for user2
        response = self.client.post('/api/token/', {'username': 'testuser2', 'password': 'password123'})
        self.token2 = response.data['access']

    def test_unauthenticated_request_denied(self):
        response = self.client.get('/api/media/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_list_media_user_scoping(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token1)
        
        # User 1 creates media
        response = self.client.post('/api/media/', {
            'title': 'Inception',
            'type': 'Movie',
            'status': 'Watched',
            'rating': 5
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['owner'], self.user1.id)

        # User 1 lists media
        response = self.client.get('/api/media/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Inception')

        # User 2 lists media (should see 0 items)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token2)
        response = self.client.get('/api/media/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
