from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Profile, User


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile"
    fk_name = "user"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    ordering = ("email",)
    list_display = ("email", "username", "is_staff", "is_active", "gg_balance")
    list_select_related = ("profile",)
    search_fields = ("email", "username")

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2"),
            },
        ),
    )

    @admin.display(description="GG balance")
    def gg_balance(self, obj):
        return obj.profile.gg_balance

    def get_inline_instances(self, request, obj=None):
        # On "add", the post_save signal creates the Profile; showing
        # ProfileInline here too makes it insert a second row with the
        # same user_id and crash with a UNIQUE constraint error. Only
        # show it once the User (and its Profile) already exist.
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "gg_balance", "wins", "losses")
    search_fields = ("user__email", "user__username")
    list_filter = ()
    autocomplete_fields = ("user",)
