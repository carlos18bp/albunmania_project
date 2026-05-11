from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        COLLECTOR = 'collector', 'Coleccionista'
        MERCHANT = 'merchant', 'Comerciante'
        WEB_MANAGER = 'web_manager', 'Web Manager'
        ADMIN = 'admin', 'Administrador'

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=50, blank=True)

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.COLLECTOR)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def assign_role(self, role: 'User.Role') -> None:
        """Set role and sync membership with the matching Django Group.

        Each Albunmanía role maps 1:1 with a Group of the same name. Assigning
        a role removes the user from other Albunmanía groups and adds them to
        the new one (idempotent). Triggers MerchantProfile creation for the
        Merchant role through the post_save signal on User.
        """
        from django.contrib.auth.models import Group

        all_role_names = {choice.value for choice in self.Role}
        for group in self.groups.filter(name__in=all_role_names):
            self.groups.remove(group)

        target_group, _ = Group.objects.get_or_create(name=role.value)
        self.groups.add(target_group)

        self.role = role.value
        self.save(update_fields=['role'])
