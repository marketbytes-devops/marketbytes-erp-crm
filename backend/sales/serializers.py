from rest_framework import serializers
from .models import (
    Company,
    Client,
    Lead,
    LeadSource,
    LeadCategory,
    LeadTeam,
    ProposalTemplate,
    RfpTemplate,
)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"


class ClientSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Client
        fields = "__all__"


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = "__all__"


class LeadCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadCategory
        fields = "__all__"


class LeadTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadTeam
        fields = "__all__"


class LeadSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_email = serializers.EmailField(source="client.email", read_only=True)
    lead_agent_name = serializers.CharField(
        source="lead_agent.user.name", read_only=True
    )

    class Meta:
        model = Lead
        fields = "__all__"


class ProposalTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = ProposalTemplate
        fields = [
            "id",
            "name",
            "template",
            "body",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


class RfpTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = RfpTemplate
        fields = [
            "id",
            "category",
            "body",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
