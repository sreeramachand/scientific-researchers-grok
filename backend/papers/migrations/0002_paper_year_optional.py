from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("papers", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="paper",
            name="year",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
