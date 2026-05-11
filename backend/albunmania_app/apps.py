from django.apps import AppConfig


class AlbunmaniaAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'albunmania_app'
    verbose_name = 'Albunmanía'

    def ready(self) -> None:
        # Importing for the side effect of registering signal handlers.
        from . import signals  # noqa: F401
