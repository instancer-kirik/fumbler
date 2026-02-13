# Resonance Profile: Code Examples

## Overview

This document provides concrete, copy-paste-ready code examples for implementing the unified resonance profile system.

---

## Part 1: Elixir Resource Updates

### Update ResonanceSpec Resource

**File:** `woem/lib/woem/resonance/resonance_spec.ex`

```elixir
defmodule Woem.Resonance.ResonanceSpec do
  use Ash.Resource,
    otp_app: :woem,
    domain: Woem.Resonance,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  postgres do
    table "resonance_specs"
    repo Woem.Repo
  end

  actions do
    defaults [:read, :update, :destroy]

    create :create do
      accept [
        :name,
        :description,
        # Layer 1-6
        :attention_model,
        :archetypes,
        :attraction_gradient,
        :engagement_curve,
        :cooperation_style,
        :dynamic_preferences,
        :repulsion_vectors,
        # Trust & Discovery
        :trust_profile,
        :discovery_introduction,
        # Original fields
        :loops,
        :lessons,
        :languages,
        :kinks,
        :type,
        :activation_vectors,
        :repulsion_vectors,
        :flirt_interface,
        :consumer_interface,
        :glossary
      ]

      change set_attribute(:user_id, actor(:id))
    end

    read :by_user do
      filter expr(user_id == ^actor(:id))
    end
  end

  policies do
    bypass AshAuthentication.Checks.AshAuthenticationInteraction do
      authorize_if always()
    end

    policy action_type(:create) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if always()
    end

    policy action_type(:update) do
      authorize_if always()
    end

    policy action_type(:destroy) do
      authorize_if always()
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :user_id, :uuid do
      allow_nil? false
    end

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    attribute :description, :string do
      public? true
    end

    # ========== LAYER 1: Attention Model ==========
    attribute :attention_model, :map do
      default %{"type" => "resonance_not_persuasion"}
      public? true
    end

    # ========== LAYER 2: Archetypes ==========
    attribute :archetypes, {:array, :map} do
      default []
      public? true
    end

    # ========== LAYER 3: Attraction Gradient ==========
    attribute :attraction_gradient, :map do
      default %{}
      public? true
    end

    # ========== LAYER 4: Engagement Curve & Cooperation ==========
    attribute :engagement_curve, :map do
      default %{}
      public? true
    end

    attribute :cooperation_style, :map do
      default %{}
      public? true
    end

    # ========== LAYER 5: Dynamic Preferences ==========
    attribute :dynamic_preferences, :map do
      default %{}
      public? true
    end

    # ========== LAYER 6: Repulsion Vectors ==========
    attribute :repulsion_vectors, :map do
      default %{}
      public? true
    end

    # ========== Trust & Discovery Layers ==========
    attribute :trust_profile, :map do
      default %{}
      public? true
    end

    attribute :discovery_introduction, :map do
      default %{}
      public? true
    end

    # ========== ORIGINAL FOUNDATIONAL FIELDS ==========
    attribute :loops, {:array, :string} do
      default []
      public? true
    end

    attribute :lessons, {:array, :string} do
      default []
      public? true
    end

    attribute :languages, :map do
      default %{}
      public? true
    end

    attribute :kinks, :map do
      default %{}
      public? true
    end

    attribute :type, :map do
      default %{}
      public? true
    end

    # ========== LEGACY FIELDS (keep for backward compat) ==========
    attribute :activation_vectors, {:array, :string} do
      default []
      public? true
    end

    attribute :flirt_interface, :map do
      default %{}
      public? true
    end

    attribute :consumer_interface, :map do
      default %{}
      public? true
    end

    attribute :glossary, :map do
      default %{}
      public? true
    end

    attribute :yaml_export, :string do
      writable? false
      default "# Resonance Spec (export pending)"
    end

    timestamps()
  end
end
```

### Update YAML Serializer

**File:** `woem/lib/woem/resonance/yaml_serializer.ex`

```elixir
defmodule Woem.Resonance.YamlSerializer do
  @moduledoc """
  Serializes and deserializes ResonanceSpec to/from YAML format.
  Version 0.2: Supports all 6 layers + trust + discovery.
  """

  def to_yaml(spec) do
    spec_map = %{
      "meta" => %{
        "version" => "0.2",
        "mode" => "experiential_profile",
        "name" => spec.name,
        "created_at" => DateTime.to_iso8601(spec.inserted_at)
      },
      # LAYER 1-6
      "attention_model" => spec.attention_model,
      "archetypes" => spec.archetypes,
      "attraction_gradient" => spec.attraction_gradient,
      "engagement_curve" => spec.engagement_curve,
      "cooperation_style" => spec.cooperation_style,
      "dynamic_preferences" => spec.dynamic_preferences,
      "repulsion_vectors" => spec.repulsion_vectors,
      # Trust & Discovery
      "trust_profile" => spec.trust_profile,
      "discovery_introduction" => spec.discovery_introduction,
      # Original fields
      "loops" => spec.loops,
      "lessons" => spec.lessons,
      "languages" => spec.languages,
      "kinks" => spec.kinks,
      "type" => spec.type,
      # Legacy (only if present for backward compat)
      "description" => spec.description,
      "activation_vectors" => spec.activation_vectors,
      "flirt_interface" => spec.flirt_interface,
      "consumer_interface" => spec.consumer_interface,
      "glossary" => spec.glossary
    }

    spec_map
    |> Enum.reject(fn {_k, v} -> v == nil or v == %{} or v == [] end)
    |> Enum.into(%{})
    |> to_yaml_string()
  end

  defp to_yaml_string(map) do
    map
    |> Jason.encode!()
    |> Jason.decode!()
    |> format_yaml(0)
  end

  defp format_yaml(map, indent) when is_map(map) do
    map
    |> Enum.map(fn {k, v} ->
      key_line = String.duplicate(" ", indent) <> "#{k}:"

      case v do
        nil ->
          key_line

        str when is_binary(str) ->
          key_line <> " #{str}"

        num when is_number(num) ->
          key_line <> " #{num}"

        bool when is_boolean(bool) ->
          key_line <> " #{bool}"

        list when is_list(list) ->
          if Enum.empty?(list) do
            key_line <> " []"
          else
            key_line <> "\n" <> format_yaml_list(list, indent + 2)
          end

        nested_map when is_map(nested_map) ->
          if map_empty?(nested_map) do
            key_line <> " {}"
          else
            key_line <> "\n" <> format_yaml(nested_map, indent + 2)
          end
      end
    end)
    |> Enum.join("\n")
  end

  defp format_yaml_list(list, indent) do
    list
    |> Enum.map(fn item ->
      case item do
        str when is_binary(str) ->
          String.duplicate(" ", indent) <> "- #{str}"

        map when is_map(map) ->
          String.duplicate(" ", indent) <> "- " <> format_yaml(map, indent + 2)

        _ ->
          String.duplicate(" ", indent) <> "- #{inspect(item)}"
      end
    end)
    |> Enum.join("\n")
  end

  defp map_empty?(map), do: map == %{}

  def from_yaml(yaml_content) do
    case YamlElixir.read_from_string(yaml_content) do
      {:ok, data} ->
        {:ok, parse_yaml_data(data)}

      {:error, reason} ->
        {:error, "Failed to parse YAML: #{inspect(reason)}"}
    end
  end

  defp parse_yaml_data(data) when is_map(data) do
    meta = data["meta"] || %{}
    name = data["name"] || meta["name"] || "Unnamed Spec"
    description = data["description"] || meta["description"]

    %{
      "name" => name,
      "description" => description,
      # LAYER 1-6
      "attention_model" => data["attention_model"] || %{"type" => "resonance_not_persuasion"},
      "archetypes" => normalize_list(data["archetypes"]),
      "attraction_gradient" => data["attraction_gradient"] || %{},
      "engagement_curve" => data["engagement_curve"] || %{},
      "cooperation_style" => data["cooperation_style"] || %{},
      "dynamic_preferences" => data["dynamic_preferences"] || %{},
      "repulsion_vectors" => data["repulsion_vectors"] || %{},
      # Trust & Discovery
      "trust_profile" => data["trust_profile"] || %{},
      "discovery_introduction" => data["discovery_introduction"] || %{},
      # Original fields
      "loops" => normalize_list(data["loops"]),
      "lessons" => normalize_list(data["lessons"]),
      "languages" => data["languages"] || %{},
      "kinks" => data["kinks"] || %{},
      "type" => data["type"] || %{},
      # Legacy fields
      "activation_vectors" => normalize_list(data["activation_vectors"]),
      "repulsion_vectors" => normalize_list(data["repulsion_vectors"]),
      "flirt_interface" => data["flirt_interface"] || %{},
      "consumer_interface" => data["consumer_interface"] || %{},
      "glossary" => data["glossary"] || %{}
    }
  end

  defp parse_yaml_data(_), do: {:error, "Invalid YAML structure"}

  defp normalize_list(value) when is_list(value), do: value
  defp normalize_list(nil), do: []
  defp normalize_list(_), do: []

  def export_filename(spec) do
    "#{spec.name |> String.downcase() |> String.replace(" ", "_")}_resonance_spec.yaml"
  end
end
```

### Profile Validator (Server-Side)

**File:** `woem/lib/woem/resonance/profile_validator.ex` (NEW)

```elixir
defmodule Woem.Resonance.ProfileValidator do
  @moduledoc """
  Validates ExperientialProfile data before saving.
  """

  def validate_full_profile(spec) do
    with :ok <- validate_attention_model(spec),
         :ok <- validate_archetypes(spec),
         :ok <- validate_dynamic_preferences(spec),
         :ok <- validate_trust_profile(spec),
         :ok <- validate_discovery_introduction(spec) do
      {:ok, spec}
    else
      {:error, reason} -> {:error, reason}
    end
  end

  defp validate_attention_model(spec) do
    if spec.attention_model["type"] == "resonance_not_persuasion" do
      :ok
    else
      {:error, "Attention model type must be 'resonance_not_persuasion'"}
    end
  end

  defp validate_archetypes(spec) do
    archetypes = spec.archetypes || []

    # Check for duplicates
    ids = Enum.map(archetypes, & &1["id"])
    unique_ids = Enum.uniq(ids)

    if length(ids) != length(unique_ids) do
      {:error, "Archetype ids must be unique"}
    else
      :ok
    end
  end

  defp validate_dynamic_preferences(spec) do
    prefs = spec.dynamic_preferences || %{}
    power = prefs["power"] || %{}

    if power["enabled"] == true do
      if power["style"] && power["flexibility"] do
        :ok
      else
        {:error, "Power style and flexibility required when enabled"}
      end
    else
      :ok
    end
  end

  defp validate_trust_profile(spec) do
    trust = spec.trust_profile || %{}

    if trust["harm_history"] && trust["harm_history"] != "" do
      if String.length(trust["harm_history"]) > 5000 do
        {:error, "harm_history exceeds 5000 characters"}
      else
        :ok
      end
    else
      :ok
    end
  end

  defp validate_discovery_introduction(spec) do
    disco = spec.discovery_introduction || %{}

    # Validate URLs if present
    if disco["audio_intro"] && !valid_supabase_url?(disco["audio_intro"]) do
      {:error, "audio_intro must be a valid Supabase URL"}
    else if disco["video_intro"] && !valid_supabase_url?(disco["video_intro"]) do
      {:error, "video_intro must be a valid Supabase URL"}
    else
      :ok
    end
    end
  end

  defp valid_supabase_url?(url) when is_binary(url) do
    url =~ ~r/^https?:\/\/.+supabase.+/
  end

  defp valid_supabase_url?(_), do: false
end
```

---

## Part 2: LiveView Components

### Main ResonanceEditor (Refactored)

**File:** `woem/lib/woem_web/live/resonance_live.ex` (EXCERPT - Tab Structure)

```elixir
defmodule WoemWeb.ResonanceLive do
  use WoemWeb, :live_view

  alias Woem.Resonance.ResonanceSpec
  alias Woem.Resonance.YamlSerializer
  alias Woem.Resonance.ProfileValidator

  require Ash.Query

  @impl true
  def mount(_params, _session, socket) do
    user = socket.assigns.current_user

    specs =
      ResonanceSpec
      |> Ash.Query.for_read(:read)
      |> Ash.Query.filter(user_id: user.id)
      |> Ash.read!(actor: user)

    {:ok,
     socket
     |> assign(:specs, specs)
     |> assign(:current_spec, nil)
     |> assign(:edit_mode, false)
     |> assign(:new_spec_mode, false)
     |> assign(:yaml_content, "")
     |> assign(:active_tab, "foundations")
     |> assign(:validation_errors, [])
     |> allow_upload(:audio_intro,
       accept: ["audio/*"],
       max_file_size: 50_000_000
     )
     |> allow_upload(:video_intro,
       accept: ["video/*"],
       max_file_size: 100_000_000
     )}
  end

  # Handle tab switching
  def handle_event("switch_tab", %{"tab" => tab}, socket) do
    {:noreply, assign(socket, :active_tab, tab)}
  end

  # Save with validation
  def handle_event("save_spec", %{"resonance_spec" => params}, socket) do
    user = socket.assigns.current_user

    # Build spec from params
    spec_params = build_spec_params(params)

    result =
      if socket.assigns.current_spec do
        socket.assigns.current_spec
        |> Ash.Changeset.for_update(:update, spec_params, actor: user)
        |> Ash.update(actor: user)
      else
        ResonanceSpec
        |> Ash.Changeset.for_create(:create, spec_params, actor: user)
        |> Ash.create(actor: user)
      end

    case result do
      {:ok, spec} ->
        # Validate before returning
        case ProfileValidator.validate_full_profile(spec) do
          {:ok, _} ->
            specs =
              ResonanceSpec
              |> Ash.Query.for_read(:read)
              |> Ash.Query.filter(user_id: user.id)
              |> Ash.read!(actor: user)

            {:noreply,
             socket
             |> assign(:specs, specs)
             |> assign(:current_spec, spec)
             |> assign(:edit_mode, false)
             |> assign(:new_spec_mode, false)
             |> assign(:yaml_content, YamlSerializer.to_yaml(spec))
             |> assign(:validation_errors, [])
             |> put_flash(:info, "Spec saved successfully")}

          {:error, reason} ->
            {:noreply,
             socket
             |> assign(:validation_errors, [reason])
             |> put_flash(:error, reason)}
        end

      {:error, changeset} ->
        errors = Ash.Changeset.errors(changeset)

        {:noreply,
         socket
         |> assign(:validation_errors, inspect(errors))
         |> put_flash(:error, "Failed to save")}
    end
  end

  # Build spec params from form, handling all layers
  defp build_spec_params(params) do
    %{
      "name" => params["name"],
      "description" => params["description"],
      # Layer 1
      "attention_model" => parse_json_field(params["attention_model"]),
      # Layer 2
      "archetypes" => parse_archetypes(params["archetypes"]),
      # Layer 3
      "attraction_gradient" => parse_json_field(params["attraction_gradient"]),
      # Layer 4
      "engagement_curve" => parse_json_field(params["engagement_curve"]),
      "cooperation_style" => parse_json_field(params["cooperation_style"]),
      # Layer 5
      "dynamic_preferences" => parse_json_field(params["dynamic_preferences"]),
      # Layer 6
      "repulsion_vectors" => parse_json_field(params["repulsion_vectors"]),
      # Trust & Discovery
      "trust_profile" => parse_json_field(params["trust_profile"]),
      "discovery_introduction" => parse_json_field(params["discovery_introduction"]),
      # Original
      "loops" => parse_vector_string(params["loops"]),
      "lessons" => parse_vector_string(params["lessons"]),
      "languages" => parse_json_field(params["languages"]),
      "kinks" => parse_json_field(params["kinks"]),
      "type" => parse_json_field(params["type"])
    }
  end

  defp parse_json_field(nil), do: %{}
  defp parse_json_field(str) when is_binary(str) do
    case Jason.decode(str) do
      {:ok, map} -> map
      {:error, _} -> %{}
    end
  end
  defp parse_json_field(map) when is_map(map), do: map

  defp parse_vector_string(nil), do: []
  defp parse_vector_string(str) when is_binary(str) do
    str
    |> String.split("\n")
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(& == ""))
  end

  defp parse_archetypes(nil), do: []
  defp parse_archetypes(str) when is_binary(str) do
    case Jason.decode(str) do
      {:ok, list} when is_list(list) -> list
      {:error, _} -> []
    end
  end
  defp parse_archetypes(list) when is_list(list), do: list
end
```

### Foundations Form Component

**File:** `woem/lib/woem_web/components/resonance_editor/_foundations_form.heex` (NEW)

```heex
<div class="space-y-6">
  <div>
    <label class="block text-sm font-semibold text-gray-900">Loops</label>
    <p class="text-xs text-gray-500 mb-2">
      💡 Patterns that keep you interested. E.g., "Intellectual challenge → deeper conversation → vulnerability"
    </p>
    <textarea
      name="resonance_spec[loops]"
      rows="4"
      placeholder="One loop per line..."
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    ><%= Enum.join(@spec.loops || [], "\n") %></textarea>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-900">Lessons</label>
    <p class="text-xs text-gray-500 mb-2">
      💡 Things you've learned about yourself or relationships
    </p>
    <textarea
      name="resonance_spec[lessons]"
      rows="4"
      placeholder="One lesson per line..."
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    ><%= Enum.join(@spec.lessons || [], "\n") %></textarea>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-900">Languages of Love</label>
    <p class="text-xs text-gray-500 mb-2">
      💡 How you give and receive affection
    </p>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium text-gray-700">Receive through</label>
        <input
          type="text"
          name="resonance_spec[languages][receiveLoveThrough]"
          placeholder="deep conversation, consistent presence..."
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          value={get_in(@spec.languages || %{}, ["receiveLoveThrough"]) |> Enum.join(", ")}
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-700">Express through</label>
        <input
          type="text"
          name="resonance_spec[languages][expressLoveThrough]"
          placeholder="intellectual engagement, showing up..."
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          value={get_in(@spec.languages || %{}, ["expressLoveThrough"]) |> Enum.join(", ")}
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-700">Communication style</label>
        <input
          type="text"
          name="resonance_spec[languages][communicationStyle]"
          placeholder="direct, playful, emotionally honest..."
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          value={get_in(@spec.languages || %{}, ["communicationStyle"]) || ""}
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-700">Vulnerability language</label>
        <input
          type="text"
          name="resonance_spec[languages][vulnerabilityLanguage]"
          placeholder="gradual disclosure, earned trust..."
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          value={get_in(@spec.languages || %{}, ["vulnerabilityLanguage"]) || ""}
        />
      </div>
    </div>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-900">Kinks & Desires</label>
    <p class="text-xs text-gray-500 mb-2">
      💡 How you experience pleasure, connection, and intensity
    </p>

    <div class="space-y-3">
      <%= for {key, label} <- [
        {"intellectual", "Intellectual"},
        {"relational", "Relational"},
        {"intensity", "Intensity"},
        {"play", "Play"},
        {"avoid", "Avoid"}
      ] do %>
        <div>
          <label class="text-xs font-medium text-gray-700"><%= label %></label>
          <textarea
            name={"resonance_spec[kinks][#{key}]"}
            rows="2"
            placeholder="Describe what this means to you..."
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          ><%= get_in(@spec.kinks || %{}, [key]) || "" %></textarea>
        </div>
      <% end %>
    </div>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-900">Type & Patterns</label>
    <p class="text-xs text-gray-500 mb-2">
      💡 How you show up in relationships
    </p>

    <div class="space-y-3">
      <%= for {key, label} <- [
        {"archetype", "Archetype/Identity"},
        {"attractionPattern", "Attraction Pattern"},
        {"roleInRelationship", "Role in Relationship"},
        {"recurringPattern", "Recurring Pattern"}
      ] do %>
        <div>
          <label class="text-xs font-medium text-gray-700"><%= label %></label>
          <input
            type="text"
            name={"resonance_spec[type][#{key}]"}
            placeholder="Describe..."
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            value={get_in(@spec.type || %{}, [key]) || ""}
          />
        </div>
      <% end %>
    </div>
  </div>

  <div class="pt-4 border-t border-gray-200">
    <p class="text-xs text-gray-600">
      📊 Completion: <span class="font-semibold"><%= get_completion_percentage(@spec) %>%</span>
    </p>
  </div>
</div>
```

### Power Dynamics Form Component

**File:** `woem/lib/woem_web/components/resonance_editor/_dynamics_form.heex` (NEW)

```heex
<div class="space-y-8">
  <!-- Power Exchange -->
  <div class="border-b border-gray-200 pb-8">
    <div class="flex items-center gap-4 mb-4">
      <input
        type="checkbox"
        id="power_enabled"
        name="resonance_spec[dynamic_preferences][power][enabled]"
        value="true"
        <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "enabled"]) == true do %>checked<% end %>
        phx-change="toggle_power"
        class="w-5 h-5"
      />
      <label for="power_enabled" class="text-sm font-semibold text-gray-900">
        Power Exchange
      </label>
    </div>

    <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "enabled"]) == true do %>
      <div class="ml-8 space-y-4">
        <p class="text-xs text-gray-500">
          💡 How does power show up in your relationships?
        </p>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Style</label>
          <select
            name="resonance_spec[dynamic_preferences][power][style]"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select a style...</option>
            <option value="performative_and_fluid" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "style"]) == "performative_and_fluid" do %>selected<% end %>>
              Performative & Fluid
            </option>
            <option value="structured" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "style"]) == "structured" do %>selected<% end %>>
              Structured
            </option>
            <option value="experimental" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "style"]) == "experimental" do %>selected<% end %>>
              Experimental
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Flexibility</label>
          <select
            name="resonance_spec[dynamic_preferences][power][flexibility]"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select flexibility...</option>
            <option value="fluid_roles" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "flexibility"]) == "fluid_roles" do %>selected<% end %>>
              Fluid Roles
            </option>
            <option value="defined_roles" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "flexibility"]) == "defined_roles" do %>selected<% end %>>
              Defined Roles
            </option>
            <option value="situational" 
              <%= if get_in(@spec.dynamic_preferences || %{}, ["power", "flexibility"]) == "situational" do %>selected<% end %>>
              Situational
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Expression Modes</label>
          <p class="text-xs text-gray-500 mb-2">Select all that apply:</p>
          <div class="space-y-2">
            <%= for mode <- [
              "performative_power_play",
              "ironic_submission_dominance",
              "theatrical_absurdity",
              "symbolic_transaction",
              "meta_aware_dynamics"
            ] do %>
              <%
                modes = get_in(@spec.dynamic_preferences || %{}, ["power", "expression_modes"]) || []
                checked = mode in modes
              %>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="resonance_spec[dynamic_preferences][power][expression_modes][]"
                  value={mode}
                  <%= if checked do %>checked<% end %>
                  class="w-4 h-4"
                />
                <span class="text-sm text-gray-700">
                  <%= String.replace(mode, "_", " ") |> String.capitalize() %>
                </span>
              </label>
            <% end %>
          </div>
        </div>