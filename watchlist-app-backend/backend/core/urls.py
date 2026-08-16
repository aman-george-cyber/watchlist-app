from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MediaViewSet, RegisterView

router = DefaultRouter()
router.register(r'media', MediaViewSet, basename='media')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]

