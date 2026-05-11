from rest_framework import serializers

from albunmania_app.models import Blog


class BlogCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ('title', 'description', 'category', 'image')
