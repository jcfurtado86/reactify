# CORE COMPONENTS

# Agents

Agents combine language models with [tools](/oss/python/langchain/tools) to create systems that can reason about tasks, decide which tools to use, and iteratively work towards solutions.

[`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent) provides a production-ready agent implementation.

[An LLM Agent runs tools in a loop to achieve a goal](https://simonwillison.net/2025/Sep/18/agents/).
An agent runs until a stop condition is met - i.e., when the model emits a final output or an iteration limit is reached.

```mermaid  theme={null}
%%{
  init: {
    "fontFamily": "monospace",
    "flowchart": {
      "curve": "curve"
    },
    "themeVariables": {"edgeLabelBackground": "transparent"}
  }
}%%
graph TD
  %% Outside the agent
  QUERY([input])
  LLM{model}
  TOOL(tools)
  ANSWER([output])

  %% Main flows (no inline labels)
  QUERY --> LLM
  LLM --"action"--> TOOL
  TOOL --"observation"--> LLM
  LLM --"finish"--> ANSWER

  classDef blueHighlight fill:#0a1c25,stroke:#0a455f,color:#bae6fd;
  classDef greenHighlight fill:#0b1e1a,stroke:#0c4c39,color:#9ce4c4;
  class QUERY blueHighlight;
  class ANSWER blueHighlight;
```

<Info>
  [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent) builds a **graph**-based agent runtime using [LangGraph](/oss/python/langgraph/overview). A graph consists of nodes (steps) and edges (connections) that define how your agent processes information. The agent moves through this graph, executing nodes like the model node (which calls the model), the tools node (which executes tools), or middleware.

  Learn more about the [Graph API](/oss/python/langgraph/graph-api).
</Info>

## Core components

### Model

The [model](/oss/python/langchain/models) is the reasoning engine of your agent. It can be specified in multiple ways, supporting both static and dynamic model selection.

#### Static model

Static models are configured once when creating the agent and remain unchanged throughout execution. This is the most common and straightforward approach.

To initialize a static model from a <Tooltip tip="A string that follows the format `provider:model` (e.g. openai:gpt-5)" cta="See mappings" href="https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model(model_provider)">model identifier string</Tooltip>:

```python wrap theme={null}
from langchain.agents import create_agent

agent = create_agent(
    "gpt-5",
    tools=tools
)
```

<Tip>
  Model identifier strings support automatic inference (e.g., `"gpt-5"` will be inferred as `"openai:gpt-5"`). Refer to the [reference](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model\(model_provider\)) to see a full list of model identifier string mappings.
</Tip>

For more control over the model configuration, initialize a model instance directly using the provider package. In this example, we use [`ChatOpenAI`](https://reference.langchain.com/python/integrations/langchain_openai/ChatOpenAI/). See [Chat models](/oss/python/integrations/chat) for other available chat model classes.

```python wrap theme={null}
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5",
    temperature=0.1,
    max_tokens=1000,
    timeout=30
    # ... (other params)
)
agent = create_agent(model, tools=tools)
```

Model instances give you complete control over configuration. Use them when you need to set specific [parameters](/oss/python/langchain/models#parameters) like `temperature`, `max_tokens`, `timeouts`, `base_url`, and other provider-specific settings. Refer to the [reference](/oss/python/integrations/providers/all_providers) to see available params and methods on your model.

#### Dynamic model

Dynamic models are selected at <Tooltip tip="The execution environment of your agent, containing immutable configuration and contextual data that persists throughout the agent's execution (e.g., user IDs, session details, or application-specific configuration).">runtime</Tooltip> based on the current <Tooltip tip="The data that flows through your agent's execution, including messages, custom fields, and any information that needs to be tracked and potentially modified during processing (e.g., user preferences or tool usage stats).">state</Tooltip> and context. This enables sophisticated routing logic and cost optimization.

To use a dynamic model, create middleware using the [`@wrap_model_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_model_call) decorator that modifies the model in the request:

```python  theme={null}
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse


basic_model = ChatOpenAI(model="gpt-4o-mini")
advanced_model = ChatOpenAI(model="gpt-4o")

@wrap_model_call
def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    """Choose model based on conversation complexity."""
    message_count = len(request.state["messages"])

    if message_count > 10:
        # Use an advanced model for longer conversations
        model = advanced_model
    else:
        model = basic_model

    request.model = model
    return handler(request)

agent = create_agent(
    model=basic_model,  # Default model
    tools=tools,
    middleware=[dynamic_model_selection]
)
```

<Warning>
  Pre-bound models (models with [`bind_tools`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.bind_tools) already called) are not supported when using structured output. If you need dynamic model selection with structured output, ensure the models passed to the middleware are not pre-bound.
</Warning>

<Tip>
  For model configuration details, see [Models](/oss/python/langchain/models). For dynamic model selection patterns, see [Dynamic model in middleware](/oss/python/langchain/middleware#dynamic-model).
</Tip>

### Tools

Tools give agents the ability to take actions. Agents go beyond simple model-only tool binding by facilitating:

* Multiple tool calls in sequence (triggered by a single prompt)
* Parallel tool calls when appropriate
* Dynamic tool selection based on previous results
* Tool retry logic and error handling
* State persistence across tool calls

For more information, see [Tools](/oss/python/langchain/tools).

#### Defining tools

Pass a list of tools to the agent.

```python wrap theme={null}
from langchain.tools import tool
from langchain.agents import create_agent


@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

@tool
def get_weather(location: str) -> str:
    """Get weather information for a location."""
    return f"Weather in {location}: Sunny, 72°F"

agent = create_agent(model, tools=[search, get_weather])
```

If an empty tool list is provided, the agent will consist of a single LLM node without tool-calling capabilities.

#### Tool error handling

To customize how tool errors are handled, use the [`@wrap_tool_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_tool_call) decorator to create middleware:

```python wrap theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage


@wrap_tool_call
def handle_tool_errors(request, handler):
    """Handle tool execution errors with custom messages."""
    try:
        return handler(request)
    except Exception as e:
        # Return a custom error message to the model
        return ToolMessage(
            content=f"Tool error: Please check your input and try again. ({str(e)})",
            tool_call_id=request.tool_call["id"]
        )

agent = create_agent(
    model="gpt-4o",
    tools=[search, get_weather],
    middleware=[handle_tool_errors]
)
```

The agent will return a [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) with the custom error message when a tool fails:

```python  theme={null}
[
    ...
    ToolMessage(
        content="Tool error: Please check your input and try again. (division by zero)",
        tool_call_id="..."
    ),
    ...
]
```

#### Tool use in the ReAct loop

Agents follow the ReAct ("Reasoning + Acting") pattern, alternating between brief reasoning steps with targeted tool calls and feeding the resulting observations into subsequent decisions until they can deliver a final answer.

<Accordion title="Example of ReAct loop">
  Prompt: Identify the current most popular wireless headphones and verify availability.

  ```
  ================================ Human Message =================================

  Find the most popular wireless headphones right now and check if they're in stock
  ```

  * **Reasoning**: "Popularity is time-sensitive, I need to use the provided search tool."
  * **Acting**: Call `search_products("wireless headphones")`

  ```
  ================================== Ai Message ==================================
  Tool Calls:
    search_products (call_abc123)
   Call ID: call_abc123
    Args:
      query: wireless headphones
  ```

  ```
  ================================= Tool Message =================================

  Found 5 products matching "wireless headphones". Top 5 results: WH-1000XM5, ...
  ```

  * **Reasoning**: "I need to confirm availability for the top-ranked item before answering."
  * **Acting**: Call `check_inventory("WH-1000XM5")`

  ```
  ================================== Ai Message ==================================
  Tool Calls:
    check_inventory (call_def456)
   Call ID: call_def456
    Args:
      product_id: WH-1000XM5
  ```

  ```
  ================================= Tool Message =================================

  Product WH-1000XM5: 10 units in stock
  ```

  * **Reasoning**: "I have the most popular model and its stock status. I can now answer the user's question."
  * **Acting**: Produce final answer

  ```
  ================================== Ai Message ==================================

  I found wireless headphones (model WH-1000XM5) with 10 units in stock...
  ```
</Accordion>

<Tip>
  To learn more about tools, see [Tools](/oss/python/langchain/tools).
</Tip>

### System prompt

You can shape how your agent approaches tasks by providing a prompt. The [`system_prompt`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent\(system_prompt\)) parameter can be provided as a string:

```python wrap theme={null}
agent = create_agent(
    model,
    tools,
    system_prompt="You are a helpful assistant. Be concise and accurate."
)
```

When no [`system_prompt`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent\(system_prompt\)) is provided, the agent will infer its task from the messages directly.

#### Dynamic system prompt

For more advanced use cases where you need to modify the system prompt based on runtime context or agent state, you can use [middleware](/oss/python/langchain/middleware).

The [`@dynamic_prompt`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.dynamic_prompt) decorator creates middleware that generates system prompts dynamically based on the model request:

```python wrap theme={null}
from typing import TypedDict

from langchain.agents import create_agent
from langchain.agents.middleware import dynamic_prompt, ModelRequest


class Context(TypedDict):
    user_role: str

@dynamic_prompt
def user_role_prompt(request: ModelRequest) -> str:
    """Generate system prompt based on user role."""
    user_role = request.runtime.context.get("user_role", "user")
    base_prompt = "You are a helpful assistant."

    if user_role == "expert":
        return f"{base_prompt} Provide detailed technical responses."
    elif user_role == "beginner":
        return f"{base_prompt} Explain concepts simply and avoid jargon."

    return base_prompt

agent = create_agent(
    model="gpt-4o",
    tools=[web_search],
    middleware=[user_role_prompt],
    context_schema=Context
)

# The system prompt will be set dynamically based on context
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Explain machine learning"}]},
    context={"user_role": "expert"}
)
```

<Tip>
  For more details on message types and formatting, see [Messages](/oss/python/langchain/messages). For comprehensive middleware documentation, see [Middleware](/oss/python/langchain/middleware).
</Tip>

## Invocation

You can invoke an agent by passing an update to its [`State`](/oss/python/langgraph/graph-api#state). All agents include a [sequence of messages](/oss/python/langgraph/use-graph-api#messagesstate) in their state; to invoke the agent, pass a new message:

```python  theme={null}
result = agent.invoke(
    {"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]}
)
```

For streaming steps and / or tokens from the agent, refer to the [streaming](/oss/python/langchain/streaming) guide.

Otherwise, the agent follows the LangGraph [Graph API](/oss/python/langgraph/use-graph-api) and supports all associated methods.

## Advanced concepts

### Structured output

In some situations, you may want the agent to return an output in a specific format. LangChain provides strategies for structured output via the [`response_format`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.ModelRequest\(response_format\)) parameter.

#### ToolStrategy

`ToolStrategy` uses artificial tool calling to generate structured output. This works with any model that supports tool calling:

```python wrap theme={null}
from pydantic import BaseModel
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy


class ContactInfo(BaseModel):
    name: str
    email: str
    phone: str

agent = create_agent(
    model="gpt-4o-mini",
    tools=[search_tool],
    response_format=ToolStrategy(ContactInfo)
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
})

result["structured_response"]
# ContactInfo(name='John Doe', email='john@example.com', phone='(555) 123-4567')
```

#### ProviderStrategy

`ProviderStrategy` uses the model provider's native structured output generation. This is more reliable but only works with providers that support native structured output (e.g., OpenAI):

```python wrap theme={null}
from langchain.agents.structured_output import ProviderStrategy

agent = create_agent(
    model="gpt-4o",
    response_format=ProviderStrategy(ContactInfo)
)
```

<Note>
  As of `langchain 1.0`, simply passing a schema (e.g., `response_format=ContactInfo`) is no longer supported. You must explicitly use `ToolStrategy` or `ProviderStrategy`.
</Note>

<Tip>
  To learn about structured output, see [Structured output](/oss/python/langchain/structured-output).
</Tip>

### Memory

Agents maintain conversation history automatically through the message state. You can also configure the agent to use a custom state schema to remember additional information during the conversation.

Information stored in the state can be thought of as the [short-term memory](/oss/python/langchain/short-term-memory) of the agent:

Custom state schemas must extend [`AgentState`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.AgentState) as a `TypedDict`.

There are two ways to define custom state:

1. Via [middleware](/oss/python/langchain/middleware) (preferred)
2. Via [`state_schema`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.AgentMiddleware.state_schema) on [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent)

<Note>
  Defining custom state via middleware is preferred over defining it via [`state_schema`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.AgentMiddleware.state_schema) on [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent) because it allows you to keep state extensions conceptually scoped to the relevant middleware and tools.

  [`state_schema`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.AgentMiddleware.state_schema) is still supported for backwards compatibility on [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent).
</Note>

#### Defining state via middleware

Use middleware to define custom state when your custom state needs to be accessed by specific middleware hooks and tools attached to said middleware.

```python  theme={null}
from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from typing import Any


class CustomState(AgentState):
    user_preferences: dict

class CustomMiddleware(AgentMiddleware):
    state_schema = CustomState
    tools = [tool1, tool2]

    def before_model(self, state: CustomState, runtime) -> dict[str, Any] | None:
        ...

agent = create_agent(
    model,
    tools=tools,
    middleware=[CustomMiddleware()]
)

# The agent can now track additional state beyond messages
result = agent.invoke({
    "messages": [{"role": "user", "content": "I prefer technical explanations"}],
    "user_preferences": {"style": "technical", "verbosity": "detailed"},
})
```

#### Defining state via `state_schema`

Use the [`state_schema`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.AgentMiddleware.state_schema) parameter as a shortcut to define custom state that is only used in tools.

```python  theme={null}
from langchain.agents import AgentState


class CustomState(AgentState):
    user_preferences: dict

agent = create_agent(
    model,
    tools=[tool1, tool2],
    state_schema=CustomState
)
# The agent can now track additional state beyond messages
result = agent.invoke({
    "messages": [{"role": "user", "content": "I prefer technical explanations"}],
    "user_preferences": {"style": "technical", "verbosity": "detailed"},
})
```

<Note>
  As of `langchain 1.0`, custom state schemas **must** be `TypedDict` types. Pydantic models and dataclasses are no longer supported. See the [v1 migration guide](/oss/python/migrate/langchain-v1#state-type-restrictions) for more details.
</Note>

<Tip>
  To learn more about memory, see [Memory](/oss/python/concepts/memory). For information on implementing long-term memory that persists across sessions, see [Long-term memory](/oss/python/langchain/long-term-memory).
</Tip>

### Streaming

We've seen how the agent can be called with `invoke` to get a final response. If the agent executes multiple steps, this may take a while. To show intermediate progress, we can stream back messages as they occur.

```python  theme={null}
for chunk in agent.stream({
    "messages": [{"role": "user", "content": "Search for AI news and summarize the findings"}]
}, stream_mode="values"):
    # Each chunk contains the full state at that point
    latest_message = chunk["messages"][-1]
    if latest_message.content:
        print(f"Agent: {latest_message.content}")
    elif latest_message.tool_calls:
        print(f"Calling tools: {[tc['name'] for tc in latest_message.tool_calls]}")
```

<Tip>
  For more details on streaming, see [Streaming](/oss/python/langchain/streaming).
</Tip>

### Middleware

[Middleware](/oss/python/langchain/middleware) provides powerful extensibility for customizing agent behavior at different stages of execution. You can use middleware to:

* Process state before the model is called (e.g., message trimming, context injection)
* Modify or validate the model's response (e.g., guardrails, content filtering)
* Handle tool execution errors with custom logic
* Implement dynamic model selection based on state or context
* Add custom logging, monitoring, or analytics

Middleware integrates seamlessly into the agent's execution graph, allowing you to intercept and modify data flow at key points without changing the core agent logic.

<Tip>
  For comprehensive middleware documentation including decorators like [`@before_model`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.before_model), [`@after_model`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.after_model), and [`@wrap_tool_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_tool_call), see [Middleware](/oss/python/langchain/middleware).
</Tip>

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/agents.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Models

[LLMs](https://en.wikipedia.org/wiki/Large_language_model) are powerful AI tools that can interpret and generate text like humans. They're versatile enough to write content, translate languages, summarize, and answer questions without needing specialized training for each task.

In addition to text generation, many models support:

* <Icon icon="hammer" size={16} /> [Tool calling](#tool-calling) - calling external tools (like databases queries or API calls) and use results in their responses.
* <Icon icon="shapes" size={16} /> [Structured output](#structured-outputs) - where the model's response is constrained to follow a defined format.
* <Icon icon="image" size={16} /> [Multimodality](#multimodal) - process and return data other than text, such as images, audio, and video.
* <Icon icon="brain" size={16} /> [Reasoning](#reasoning) - models perform multi-step reasoning to arrive at a conclusion.

Models are the reasoning engine of [agents](/oss/python/langchain/agents). They drive the agent's decision-making process, determining which tools to call, how to interpret results, and when to provide a final answer.

The quality and capabilities of the model you choose directly impact your agent's reliability and performance. Different models excel at different tasks - some are better at following complex instructions, others at structured reasoning, and some support larger context windows for handling more information.

LangChain's standard model interfaces give you access to many different provider integrations, which makes it easy to experiment with and switch between models to find the best fit for your case.

<Info>
  For provider-specific integration information and capabilities, see the provider's [chat model page](/oss/python/integrations/chat).
</Info>

## Basic usage

Models can be utilized in two ways:

1. **With agents** - Models can be dynamically specified when creating an [agent](/oss/python/langchain/agents#model).
2. **Standalone** - Models can be called directly (outside of the agent loop) for tasks like text generation, classification, or extraction without the need for an agent framework.

The same model interface works in both contexts, which gives you the flexibility to start simple and scale up to more complex agent-based workflows as needed.

### Initialize a model

The easiest way to get started with a standalone model in LangChain is to use [`init_chat_model`](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model) to initialize one from a [chat model provider](/oss/python/integrations/chat) of your choice (examples below):

<Tabs>
  <Tab title="OpenAI">
    👉 Read the [OpenAI chat model integration docs](/oss/python/integrations/chat/openai/)

    ```shell  theme={null}
    pip install -U "langchain[openai]"
    ```

    <CodeGroup>
      ```python init_chat_model theme={null}
      import os
      from langchain.chat_models import init_chat_model

      os.environ["OPENAI_API_KEY"] = "sk-..."

      model = init_chat_model("gpt-4.1")
      ```

      ```python Model Class theme={null}
      import os
      from langchain_openai import ChatOpenAI

      os.environ["OPENAI_API_KEY"] = "sk-..."

      model = ChatOpenAI(model="gpt-4.1")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Anthropic">
    👉 Read the [Anthropic chat model integration docs](/oss/python/integrations/chat/anthropic/)

    ```shell  theme={null}
    pip install -U "langchain[anthropic]"
    ```

    <CodeGroup>
      ```python init_chat_model theme={null}
      import os
      from langchain.chat_models import init_chat_model

      os.environ["ANTHROPIC_API_KEY"] = "sk-..."

      model = init_chat_model("claude-sonnet-4-5-20250929")
      ```

      ```python Model Class theme={null}
      import os
      from langchain_anthropic import ChatAnthropic

      os.environ["ANTHROPIC_API_KEY"] = "sk-..."

      model = ChatAnthropic(model="claude-sonnet-4-5-20250929")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Azure">
    👉 Read the [Azure chat model integration docs](/oss/python/integrations/chat/azure_chat_openai/)

    ```shell  theme={null}
    pip install -U "langchain[openai]"
    ```

    <CodeGroup>
      ```python init_chat_model theme={null}
      import os
      from langchain.chat_models import init_chat_model

      os.environ["AZURE_OPENAI_API_KEY"] = "..."
      os.environ["AZURE_OPENAI_ENDPOINT"] = "..."
      os.environ["OPENAI_API_VERSION"] = "2025-03-01-preview"

      model = init_chat_model(
          "azure_openai:gpt-4.1",
          azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"],
      )
      ```

      ```python Model Class theme={null}
      import os
      from langchain_openai import AzureChatOpenAI

      os.environ["AZURE_OPENAI_API_KEY"] = "..."
      os.environ["AZURE_OPENAI_ENDPOINT"] = "..."
      os.environ["OPENAI_API_VERSION"] = "2025-03-01-preview"

      model = AzureChatOpenAI(
          model="gpt-4.1",
          azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]
      )
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Google Gemini">
    👉 Read the [Google GenAI chat model integration docs](/oss/python/integrations/chat/google_generative_ai/)

    ```shell  theme={null}
    pip install -U "langchain[google-genai]"
    ```

    <CodeGroup>
      ```python init_chat_model theme={null}
      import os
      from langchain.chat_models import init_chat_model

      os.environ["GOOGLE_API_KEY"] = "..."

      model = init_chat_model("google_genai:gemini-2.5-flash-lite")
      ```

      ```python Model Class theme={null}
      import os
      from langchain_google_genai import ChatGoogleGenerativeAI

      os.environ["GOOGLE_API_KEY"] = "..."

      model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="AWS Bedrock">
    👉 Read the [AWS Bedrock chat model integration docs](/oss/python/integrations/chat/bedrock/)

    ```shell  theme={null}
    pip install -U "langchain[aws]"
    ```

    <CodeGroup>
      ```python init_chat_model theme={null}
      from langchain.chat_models import init_chat_model

      # Follow the steps here to configure your credentials:
      # https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html

      model = init_chat_model(
          "anthropic.claude-3-5-sonnet-20240620-v1:0",
          model_provider="bedrock_converse",
      )
      ```

      ```python Model Class theme={null}
      from langchain_aws import ChatBedrock

      model = ChatBedrock(model="anthropic.claude-3-5-sonnet-20240620-v1:0")
      ```
    </CodeGroup>
  </Tab>
</Tabs>

```python  theme={null}
response = model.invoke("Why do parrots talk?")
```

See [`init_chat_model`](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model) for more detail, including information on how to pass model [parameters](#parameters).

### Key methods

<Card title="Invoke" href="#invoke" icon="paper-plane" arrow="true" horizontal>
  The model takes messages as input and outputs messages after generating a complete response.
</Card>

<Card title="Stream" href="#stream" icon="tower-broadcast" arrow="true" horizontal>
  Invoke the model, but stream the output as it is generated in real-time.
</Card>

<Card title="Batch" href="#batch" icon="grip" arrow="true" horizontal>
  Send multiple requests to a model in a batch for more efficient processing.
</Card>

<Info>
  In addition to chat models, LangChain provides support for other adjacent technologies, such as embedding models and vector stores. See the [integrations page](/oss/python/integrations/providers/overview) for details.
</Info>

## Parameters

A chat model takes parameters that can be used to configure its behavior. The full set of supported parameters varies by model and provider, but standard ones include:

<ParamField body="model" type="string" required>
  The name or identifier of the specific model you want to use with a provider.
</ParamField>

<ParamField body="api_key" type="string">
  The key required for authenticating with the model's provider. This is usually issued when you sign up for access to the model. Often accessed by setting an <Tooltip tip="A variable whose value is set outside the program, typically through functionality built into the operating system or microservice.">environment variable</Tooltip>.
</ParamField>

<ParamField body="temperature" type="number">
  Controls the randomness of the model's output. A higher number makes responses more creative; lower ones make them more deterministic.
</ParamField>

<ParamField body="timeout" type="number">
  The maximum time (in seconds) to wait for a response from the model before canceling the request.
</ParamField>

<ParamField body="max_tokens" type="number">
  Limits the total number of <Tooltip tip="The basic unit that a model reads and generates. Providers may define them differently, but in general, they can represent a whole or part of word.">tokens</Tooltip> in the response, effectively controlling how long the output can be.
</ParamField>

<ParamField body="max_retries" type="number">
  The maximum number of attempts the system will make to resend a request if it fails due to issues like network timeouts or rate limits.
</ParamField>

Using [`init_chat_model`](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model), pass these parameters as inline <Tooltip tip="Arbitrary keyword arguments" cta="Learn more" href="https://www.w3schools.com/python/python_args_kwargs.asp">`**kwargs`</Tooltip>:

```python Initialize using model parameters theme={null}
model = init_chat_model(
    "claude-sonnet-4-5-20250929",
    # Kwargs passed to the model:
    temperature=0.7,
    timeout=30,
    max_tokens=1000,
)
```

<Info>
  Each chat model integration may have additional params used to control provider-specific functionality. For example, [`ChatOpenAI`](https://reference.langchain.com/python/integrations/langchain_openai/ChatOpenAI/) has `use_responses_api` to dictate whether to use the OpenAI Responses or Completions API.

  To find all the parameters supported by a given chat model, head to the [chat model integrations](/oss/python/integrations/chat) page.
</Info>

***

## Invocation

A chat model must be invoked to generate an output. There are three primary invocation methods, each suited to different use cases.

### Invoke

The most straightforward way to call a model is to use [`invoke()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.invoke) with a single message or a list of messages.

```python Single message theme={null}
response = model.invoke("Why do parrots have colorful feathers?")
print(response)
```

A list of messages can be provided to a model to represent conversation history. Each message has a role that models use to indicate who sent the message in the conversation. See the [messages](/oss/python/langchain/messages) guide for more detail on roles, types, and content.

```python Dictionary format theme={null}
from langchain.messages import HumanMessage, AIMessage, SystemMessage

conversation = [
    {"role": "system", "content": "You are a helpful assistant that translates English to French."},
    {"role": "user", "content": "Translate: I love programming."},
    {"role": "assistant", "content": "J'adore la programmation."},
    {"role": "user", "content": "Translate: I love building applications."}
]

response = model.invoke(conversation)
print(response)  # AIMessage("J'adore créer des applications.")
```

```python Message objects theme={null}
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

conversation = [
    SystemMessage("You are a helpful assistant that translates English to French."),
    HumanMessage("Translate: I love programming."),
    AIMessage("J'adore la programmation."),
    HumanMessage("Translate: I love building applications.")
]

response = model.invoke(conversation)
print(response)  # AIMessage("J'adore créer des applications.")
```

### Stream

Most models can stream their output content while it is being generated. By displaying output progressively, streaming significantly improves user experience, particularly for longer responses.

Calling [`stream()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.stream) returns an <Tooltip tip="An object that progressively provides access to each item of a collection, in order.">iterator</Tooltip> that yields output chunks as they are produced. You can use a loop to process each chunk in real-time:

<CodeGroup>
  ```python Basic text streaming theme={null}
  for chunk in model.stream("Why do parrots have colorful feathers?"):
      print(chunk.text, end="|", flush=True)
  ```

  ```python Stream tool calls, reasoning, and other content theme={null}
  for chunk in model.stream("What color is the sky?"):
      for block in chunk.content_blocks:
          if block["type"] == "reasoning" and (reasoning := block.get("reasoning")):
              print(f"Reasoning: {reasoning}")
          elif block["type"] == "tool_call_chunk":
              print(f"Tool call chunk: {block}")
          elif block["type"] == "text":
              print(block["text"])
          else:
              ...
  ```
</CodeGroup>

As opposed to [`invoke()`](#invoke), which returns a single [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) after the model has finished generating its full response, `stream()` returns multiple [`AIMessageChunk`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessageChunk) objects, each containing a portion of the output text. Importantly, each chunk in a stream is designed to be gathered into a full message via summation:

```python Construct an AIMessage theme={null}
full = None  # None | AIMessageChunk
for chunk in model.stream("What color is the sky?"):
    full = chunk if full is None else full + chunk
    print(full.text)

# The
# The sky
# The sky is
# The sky is typically
# The sky is typically blue
# ...

print(full.content_blocks)
# [{"type": "text", "text": "The sky is typically blue..."}]
```

The resulting message can be treated the same as a message that was generated with [`invoke()`](#invoke) - for example, it can be aggregated into a message history and passed back to the model as conversational context.

<Warning>
  Streaming only works if all steps in the program know how to process a stream of chunks. For instance, an application that isn't streaming-capable would be one that needs to store the entire output in memory before it can be processed.
</Warning>

<Accordion title="Advanced streaming topics">
  <Accordion title="&#x22;Auto-streaming&#x22; chat models">
    LangChain simplifies streaming from chat models by automatically enabling streaming mode in certain cases, even when you're not explicitly calling the streaming methods. This is particularly useful when you use the non-streaming invoke method but still want to stream the entire application, including intermediate results from the chat model.

    In [LangGraph agents](/oss/python/langchain/agents), for example, you can call `model.invoke()` within nodes, but LangChain will automatically delegate to streaming if running in a streaming mode.

    #### How it works

    When you `invoke()` a chat model, LangChain will automatically switch to an internal streaming mode if it detects that you are trying to stream the overall application. The result of the invocation will be the same as far as the code that was using invoke is concerned; however, while the chat model is being streamed, LangChain will take care of invoking [`on_llm_new_token`](https://reference.langchain.com/python/langchain_core/callbacks/#langchain_core.callbacks.base.AsyncCallbackHandler.on_llm_new_token) events in LangChain's callback system.

    Callback events allow LangGraph `stream()` and [`astream_events()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.astream_events) to surface the chat model's output in real-time.
  </Accordion>

  <Accordion title="Streaming events">
    LangChain chat models can also stream semantic events using [`astream_events()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.astream_events).

    This simplifies filtering based on event types and other metadata, and will aggregate the full message in the background. See below for an example.

    ```python  theme={null}
    async for event in model.astream_events("Hello"):

        if event["event"] == "on_chat_model_start":
            print(f"Input: {event['data']['input']}")

        elif event["event"] == "on_chat_model_stream":
            print(f"Token: {event['data']['chunk'].text}")

        elif event["event"] == "on_chat_model_end":
            print(f"Full message: {event['data']['output'].text}")

        else:
            pass
    ```

    ```txt  theme={null}
    Input: Hello
    Token: Hi
    Token:  there
    Token: !
    Token:  How
    Token:  can
    Token:  I
    ...
    Full message: Hi there! How can I help today?
    ```

    <Tip>
      See the [`astream_events()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.astream_events) reference for event types and other details.
    </Tip>
  </Accordion>
</Accordion>

### Batch

Batching a collection of independent requests to a model can significantly improve performance and reduce costs, as the processing can be done in parallel:

```python Batch theme={null}
responses = model.batch([
    "Why do parrots have colorful feathers?",
    "How do airplanes fly?",
    "What is quantum computing?"
])
for response in responses:
    print(response)
```

<Note>
  This section describes a chat model method [`batch()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch), which parallelizes model calls client-side.

  It is **distinct** from batch APIs supported by inference providers, such as [OpenAI](https://platform.openai.com/docs/guides/batch) or [Anthropic](https://docs.claude.com/en/docs/build-with-claude/batch-processing#message-batches-api).
</Note>

By default, [`batch()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch) will only return the final output for the entire batch. If you want to receive the output for each individual input as it finishes generating, you can stream results with [`batch_as_completed()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed):

```python Yield batch responses upon completion theme={null}
for response in model.batch_as_completed([
    "Why do parrots have colorful feathers?",
    "How do airplanes fly?",
    "What is quantum computing?"
]):
    print(response)
```

<Note>
  When using [`batch_as_completed()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed), results may arrive out of order. Each includes the input index for matching to reconstruct the original order as needed.
</Note>

<Tip>
  When processing a large number of inputs using [`batch()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch) or [`batch_as_completed()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed), you may want to control the maximum number of parallel calls. This can be done by setting the [`max_concurrency`](https://reference.langchain.com/python/langchain_core/runnables/#langchain_core.runnables.RunnableConfig.max_concurrency) attribute in the [`RunnableConfig`](https://reference.langchain.com/python/langchain_core/runnables/#langchain_core.runnables.RunnableConfig) dictionary.

  ```python Batch with max concurrency theme={null}
  model.batch(
      list_of_inputs,
      config={
          'max_concurrency': 5,  # Limit to 5 parallel calls
      }
  )
  ```

  See the [`RunnableConfig`](https://reference.langchain.com/python/langchain_core/runnables/#langchain_core.runnables.RunnableConfig) reference for a full list of supported attributes.
</Tip>

For more details on batching, see the [reference](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch).

***

## Tool calling

Models can request to call tools that perform tasks such as fetching data from a database, searching the web, or running code. Tools are pairings of:

1. A schema, including the name of the tool, a description, and/or argument definitions (often a JSON schema)
2. A function or <Tooltip tip="A method that can suspend execution and resume at a later time">coroutine</Tooltip> to execute.

<Note>
  You may hear the term "function calling". We use this interchangeably with "tool calling".
</Note>

Here's the basic tool calling flow between a user and a model:

```mermaid  theme={null}
sequenceDiagram
    participant U as User
    participant M as Model
    participant T as Tools

    U->>M: "What's the weather in SF and NYC?"
    M->>M: Analyze request & decide tools needed

    par Parallel Tool Calls
        M->>T: get_weather("San Francisco")
        M->>T: get_weather("New York")
    end

    par Tool Execution
        T-->>M: SF weather data
        T-->>M: NYC weather data
    end

    M->>M: Process results & generate response
    M->>U: "SF: 72°F sunny, NYC: 68°F cloudy"
```

To make tools that you have defined available for use by a model, you must bind them using [`bind_tools()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.bind_tools). In subsequent invocations, the model can choose to call any of the bound tools as needed.

Some model providers offer built-in tools that can be enabled via model or invocation parameters (e.g. [`ChatOpenAI`](/oss/python/integrations/chat/openai), [`ChatAnthropic`](/oss/python/integrations/chat/anthropic)). Check the respective [provider reference](/oss/python/integrations/providers/overview) for details.

<Tip>
  See the [tools guide](/oss/python/langchain/tools) for details and other options for creating tools.
</Tip>

```python Binding user tools theme={null}
from langchain.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get the weather at a location."""
    return f"It's sunny in {location}."


model_with_tools = model.bind_tools([get_weather])  # [!code highlight]

response = model_with_tools.invoke("What's the weather like in Boston?")
for tool_call in response.tool_calls:
    # View tool calls made by the model
    print(f"Tool: {tool_call['name']}")
    print(f"Args: {tool_call['args']}")
```

When binding user-defined tools, the model's response includes a **request** to execute a tool. When using a model separately from an [agent](/oss/python/langchain/agents), it is up to you to perform the requested action and return the result back to the model for use in subsequent reasoning. Note that when using an [agent](/oss/python/langchain/agents), the agent loop will handle the tool execution loop for you.

Below, we show some common ways you can use tool calling.

<AccordionGroup>
  <Accordion title="Tool execution loop" icon="arrow-rotate-right">
    When a model returns tool calls, you need to execute the tools and pass the results back to the model. This creates a conversation loop where the model can use tool results to generate its final response. LangChain includes [agent](/oss/python/langchain/agents) abstractions that handle this orchestration for you.

    Here's a simple example of how to do this:

    ```python Tool execution loop theme={null}
    # Bind (potentially multiple) tools to the model
    model_with_tools = model.bind_tools([get_weather])

    # Step 1: Model generates tool calls
    messages = [{"role": "user", "content": "What's the weather in Boston?"}]
    ai_msg = model_with_tools.invoke(messages)
    messages.append(ai_msg)

    # Step 2: Execute tools and collect results
    for tool_call in ai_msg.tool_calls:
        # Execute the tool with the generated arguments
        tool_result = get_weather.invoke(tool_call)
        messages.append(tool_result)

    # Step 3: Pass results back to model for final response
    final_response = model_with_tools.invoke(messages)
    print(final_response.text)
    # "The current weather in Boston is 72°F and sunny."
    ```

    Each [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) returned by the tool includes a `tool_call_id` that matches the original tool call, helping the model correlate results with requests.
  </Accordion>

  <Accordion title="Forcing tool calls" icon="asterisk">
    By default, the model has the freedom to choose which bound tool to use based on the user's input. However, you might want to force choosing a tool, ensuring the model uses either a particular tool or **any** tool from a given list:

    <CodeGroup>
      ```python Force use of any tool theme={null}
      model_with_tools = model.bind_tools([tool_1], tool_choice="any")
      ```

      ```python Force use of specific tools theme={null}
      model_with_tools = model.bind_tools([tool_1], tool_choice="tool_1")
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Parallel tool calls" icon="layer-group">
    Many models support calling multiple tools in parallel when appropriate. This allows the model to gather information from different sources simultaneously.

    ```python Parallel tool calls theme={null}
    model_with_tools = model.bind_tools([get_weather])

    response = model_with_tools.invoke(
        "What's the weather in Boston and Tokyo?"
    )


    # The model may generate multiple tool calls
    print(response.tool_calls)
    # [
    #   {'name': 'get_weather', 'args': {'location': 'Boston'}, 'id': 'call_1'},
    #   {'name': 'get_weather', 'args': {'location': 'Tokyo'}, 'id': 'call_2'},
    # ]


    # Execute all tools (can be done in parallel with async)
    results = []
    for tool_call in response.tool_calls:
        if tool_call['name'] == 'get_weather':
            result = get_weather.invoke(tool_call)
        ...
        results.append(result)
    ```

    The model intelligently determines when parallel execution is appropriate based on the independence of the requested operations.

    <Tip>
      Most models supporting tool calling enable parallel tool calls by default. Some (including [OpenAI](/oss/python/integrations/chat/openai) and [Anthropic](/oss/python/integrations/chat/anthropic)) allow you to disable this feature. To do this, set `parallel_tool_calls=False`:

      ```python  theme={null}
      model.bind_tools([get_weather], parallel_tool_calls=False)
      ```
    </Tip>
  </Accordion>

  <Accordion title="Streaming tool calls" icon="rss">
    When streaming responses, tool calls are progressively built through [`ToolCallChunk`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolCallChunk). This allows you to see tool calls as they're being generated rather than waiting for the complete response.

    ```python Streaming tool calls theme={null}
    for chunk in model_with_tools.stream(
        "What's the weather in Boston and Tokyo?"
    ):
        # Tool call chunks arrive progressively
        for tool_chunk in chunk.tool_call_chunks:
            if name := tool_chunk.get("name"):
                print(f"Tool: {name}")
            if id_ := tool_chunk.get("id"):
                print(f"ID: {id_}")
            if args := tool_chunk.get("args"):
                print(f"Args: {args}")

    # Output:
    # Tool: get_weather
    # ID: call_SvMlU1TVIZugrFLckFE2ceRE
    # Args: {"lo
    # Args: catio
    # Args: n": "B
    # Args: osto
    # Args: n"}
    # Tool: get_weather
    # ID: call_QMZdy6qInx13oWKE7KhuhOLR
    # Args: {"lo
    # Args: catio
    # Args: n": "T
    # Args: okyo
    # Args: "}
    ```

    You can accumulate chunks to build complete tool calls:

    ```python Accumulate tool calls theme={null}
    gathered = None
    for chunk in model_with_tools.stream("What's the weather in Boston?"):
        gathered = chunk if gathered is None else gathered + chunk
        print(gathered.tool_calls)
    ```
  </Accordion>
</AccordionGroup>

***

## Structured outputs

Models can be requested to provide their response in a format matching a given schema. This is useful for ensuring the output can be easily parsed and used in subsequent processing. LangChain supports multiple schema types and methods for enforcing structured outputs.

<Tabs>
  <Tab title="Pydantic">
    [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/#basic-model-usage) provide the richest feature set with field validation, descriptions, and nested structures.

    ```python  theme={null}
    from pydantic import BaseModel, Field

    class Movie(BaseModel):
        """A movie with details."""
        title: str = Field(..., description="The title of the movie")
        year: int = Field(..., description="The year the movie was released")
        director: str = Field(..., description="The director of the movie")
        rating: float = Field(..., description="The movie's rating out of 10")

    model_with_structure = model.with_structured_output(Movie)
    response = model_with_structure.invoke("Provide details about the movie Inception")
    print(response)  # Movie(title="Inception", year=2010, director="Christopher Nolan", rating=8.8)
    ```
  </Tab>

  <Tab title="TypedDict">
    `TypedDict` provides a simpler alternative using Python's built-in typing, ideal when you don't need runtime validation.

    ```python  theme={null}
    from typing_extensions import TypedDict, Annotated

    class MovieDict(TypedDict):
        """A movie with details."""
        title: Annotated[str, ..., "The title of the movie"]
        year: Annotated[int, ..., "The year the movie was released"]
        director: Annotated[str, ..., "The director of the movie"]
        rating: Annotated[float, ..., "The movie's rating out of 10"]

    model_with_structure = model.with_structured_output(MovieDict)
    response = model_with_structure.invoke("Provide details about the movie Inception")
    print(response)  # {'title': 'Inception', 'year': 2010, 'director': 'Christopher Nolan', 'rating': 8.8}
    ```
  </Tab>

  <Tab title="JSON Schema">
    For maximum control or interoperability, you can provide a raw JSON Schema.

    ```python  theme={null}
    import json

    json_schema = {
        "title": "Movie",
        "description": "A movie with details",
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title of the movie"
            },
            "year": {
                "type": "integer",
                "description": "The year the movie was released"
            },
            "director": {
                "type": "string",
                "description": "The director of the movie"
            },
            "rating": {
                "type": "number",
                "description": "The movie's rating out of 10"
            }
        },
        "required": ["title", "year", "director", "rating"]
    }

    model_with_structure = model.with_structured_output(
        json_schema,
        method="json_schema",
    )
    response = model_with_structure.invoke("Provide details about the movie Inception")
    print(response)  # {'title': 'Inception', 'year': 2010, ...}
    ```
  </Tab>
</Tabs>

<Note>
  **Key considerations for structured outputs:**

  * **Method parameter**: Some providers support different methods (`'json_schema'`, `'function_calling'`, `'json_mode'`)
    * `'json_schema'` typically refers to dedicated structured output features offered by a provider
    * `'function_calling'` derives structured output by forcing a [tool call](#tool-calling) following the given schema
    * `'json_mode'` is a precursor to `'json_schema'` offered by some providers- it generates valid json, but the schema must be described in the prompt
  * **Include raw**: Use `include_raw=True` to get both the parsed output and the raw AI message
  * **Validation**: Pydantic models provide automatic validation, while `TypedDict` and JSON Schema require manual validation
</Note>

<Accordion title="Example: Message output alongside parsed structure">
  It can be useful to return the raw [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) object alongside the parsed representation to access response metadata such as [token counts](#token-usage). To do this, set [`include_raw=True`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.with_structured_output\(include_raw\)) when calling [`with_structured_output`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.with_structured_output):

  ```python  theme={null}
  from pydantic import BaseModel, Field

  class Movie(BaseModel):
      """A movie with details."""
      title: str = Field(..., description="The title of the movie")
      year: int = Field(..., description="The year the movie was released")
      director: str = Field(..., description="The director of the movie")
      rating: float = Field(..., description="The movie's rating out of 10")

  model_with_structure = model.with_structured_output(Movie, include_raw=True)  # [!code highlight]
  response = model_with_structure.invoke("Provide details about the movie Inception")
  response
  # {
  #     "raw": AIMessage(...),
  #     "parsed": Movie(title=..., year=..., ...),
  #     "parsing_error": None,
  # }
  ```
</Accordion>

<Accordion title="Example: Nested structures">
  Schemas can be nested:

  <CodeGroup>
    ```python Pydantic BaseModel theme={null}
    from pydantic import BaseModel, Field

    class Actor(BaseModel):
        name: str
        role: str

    class MovieDetails(BaseModel):
        title: str
        year: int
        cast: list[Actor]
        genres: list[str]
        budget: float | None = Field(None, description="Budget in millions USD")

    model_with_structure = model.with_structured_output(MovieDetails)
    ```

    ```python TypedDict theme={null}
    from typing_extensions import Annotated, TypedDict

    class Actor(TypedDict):
        name: str
        role: str

    class MovieDetails(TypedDict):
        title: str
        year: int
        cast: list[Actor]
        genres: list[str]
        budget: Annotated[float | None, ..., "Budget in millions USD"]

    model_with_structure = model.with_structured_output(MovieDetails)
    ```
  </CodeGroup>
</Accordion>

***

## Supported models

LangChain supports all major model providers, including OpenAI, Anthropic, Google, Azure, AWS Bedrock, and more. Each provider offers a variety of models with different capabilities. For a full list of supported models in LangChain, see the [integrations page](/oss/python/integrations/providers/overview).

***

## Advanced topics

### Multimodal

Certain models can process and return non-textual data such as images, audio, and video. You can pass non-textual data to a model by providing [content blocks](/oss/python/langchain/messages#message-content).

<Tip>
  All LangChain chat models with underlying multimodal capabilities support:

  1. Data in the cross-provider standard format (see [our messages guide](/oss/python/langchain/messages))
  2. OpenAI [chat completions](https://platform.openai.com/docs/api-reference/chat) format
  3. Any format that is native to that specific provider (e.g., Anthropic models accept Anthropic native format)
</Tip>

See the [multimodal section](/oss/python/langchain/messages#multimodal) of the messages guide for details.

<Tooltip tip="Not all LLMs are made equally!" cta="See reference" href="https://models.dev/">Some models</Tooltip> can return multimodal data as part of their response. If invoked to do so, the resulting [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) will have content blocks with multimodal types.

```python Multimodal output theme={null}
response = model.invoke("Create a picture of a cat")
print(response.content_blocks)
# [
#     {"type": "text", "text": "Here's a picture of a cat"},
#     {"type": "image", "base64": "...", "mime_type": "image/jpeg"},
# ]
```

See the [integrations page](/oss/python/integrations/providers/overview) for details on specific providers.

### Reasoning

Newer models are capable of performing multi-step reasoning to arrive at a conclusion. This involves breaking down complex problems into smaller, more manageable steps.

**If supported by the underlying model,** you can surface this reasoning process to better understand how the model arrived at its final answer.

<CodeGroup>
  ```python Stream reasoning output theme={null}
  for chunk in model.stream("Why do parrots have colorful feathers?"):
      reasoning_steps = [r for r in chunk.content_blocks if r["type"] == "reasoning"]
      print(reasoning_steps if reasoning_steps else chunk.text)
  ```

  ```python Complete reasoning output theme={null}
  response = model.invoke("Why do parrots have colorful feathers?")
  reasoning_steps = [b for b in response.content_blocks if b["type"] == "reasoning"]
  print(" ".join(step["reasoning"] for step in reasoning_steps))
  ```
</CodeGroup>

Depending on the model, you can sometimes specify the level of effort it should put into reasoning. Similarly, you can request that the model turn off reasoning entirely. This may take the form of categorical "tiers" of reasoning (e.g., `'low'` or `'high'`) or integer token budgets.

For details, see the [integrations page](/oss/python/integrations/providers/overview) or [reference](https://reference.langchain.com/python/integrations/) for your respective chat model.

### Local models

LangChain supports running models locally on your own hardware. This is useful for scenarios where either data privacy is critical, you want to invoke a custom model, or when you want to avoid the costs incurred when using a cloud-based model.

[Ollama](/oss/python/integrations/chat/ollama) is one of the easiest ways to run models locally. See the full list of local integrations on the [integrations page](/oss/python/integrations/providers/overview).

### Prompt caching

Many providers offer prompt caching features to reduce latency and cost on repeat processing of the same tokens. These features can be **implicit** or **explicit**:

* **Implicit prompt caching:** providers will automatically pass on cost savings if a request hits a cache. Examples: [OpenAI](/oss/python/integrations/chat/openai) and [Gemini](/oss/python/integrations/chat/google_generative_ai) (Gemini 2.5 and above).
* **Explicit caching:** providers allow you to manually indicate cache points for greater control or to guarantee cost savings. Examples: [`ChatOpenAI`](https://reference.langchain.com/python/integrations/langchain_openai/ChatOpenAI/) (via `prompt_cache_key`), Anthropic's [`AnthropicPromptCachingMiddleware`](/oss/python/integrations/chat/anthropic#prompt-caching) and [`cache_control`](https://docs.langchain.com/oss/python/integrations/chat/anthropic#prompt-caching) options, [AWS Bedrock](/oss/python/integrations/chat/bedrock#prompt-caching), [Gemini](https://python.langchain.com/api_reference/google_genai/chat_models/langchain_google_genai.chat_models.ChatGoogleGenerativeAI.html).

<Warning>
  Prompt caching is often only engaged above a minimum input token threshold. See [provider pages](/oss/python/integrations/chat) for details.
</Warning>

Cache usage will be reflected in the [usage metadata](/oss/python/langchain/messages#token-usage) of the model response.

### Server-side tool use

Some providers support server-side [tool-calling](#tool-calling) loops: models can interact with web search, code interpreters, and other tools and analyze the results in a single conversational turn.

If a model invokes a tool server-side, the content of the response message will include content representing the invocation and result of the tool. Accessing the [content blocks](/oss/python/langchain/messages#standard-content-blocks) of the response will return the server-side tool calls and results in a provider-agnostic format:

```python Invoke with server-side tool use theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4.1-mini")

tool = {"type": "web_search"}
model_with_tools = model.bind_tools([tool])

response = model_with_tools.invoke("What was a positive news story from today?")
response.content_blocks
```

```python Result expandable theme={null}
[
    {
        "type": "server_tool_call",
        "name": "web_search",
        "args": {
            "query": "positive news stories today",
            "type": "search"
        },
        "id": "ws_abc123"
    },
    {
        "type": "server_tool_result",
        "tool_call_id": "ws_abc123",
        "status": "success"
    },
    {
        "type": "text",
        "text": "Here are some positive news stories from today...",
        "annotations": [
            {
                "end_index": 410,
                "start_index": 337,
                "title": "article title",
                "type": "citation",
                "url": "..."
            }
        ]
    }
]
```

This represents a single conversational turn; there are no associated [ToolMessage](/oss/python/langchain/messages#tool-message) objects that need to be passed in as in client-side [tool-calling](#tool-calling).

See the [integration page](/oss/python/integrations/chat) for your given provider for available tools and usage details.

### Rate limiting

Many chat model providers impose a limit on the number of invocations that can be made in a given time period. If you hit a rate limit, you will typically receive a rate limit error response from the provider, and will need to wait before making more requests.

To help manage rate limits, chat model integrations accept a `rate_limiter` parameter that can be provided during initialization to control the rate at which requests are made.

<Accordion title="Initialize and use a rate limiter" icon="gauge-high">
  LangChain in comes with (an optional) built-in [`InMemoryRateLimiter`](https://reference.langchain.com/python/langchain_core/rate_limiters/#langchain_core.rate_limiters.InMemoryRateLimiter). This limiter is thread safe and can be shared by multiple threads in the same process.

  ```python Define a rate limiter theme={null}
  from langchain_core.rate_limiters import InMemoryRateLimiter

  rate_limiter = InMemoryRateLimiter(
      requests_per_second=0.1,  # 1 request every 10s
      check_every_n_seconds=0.1,  # Check every 100ms whether allowed to make a request
      max_bucket_size=10,  # Controls the maximum burst size.
  )

  model = init_chat_model(
      model="gpt-5",
      model_provider="openai",
      rate_limiter=rate_limiter  # [!code highlight]
  )
  ```

  <Warning>
    The provided rate limiter can only limit the number of requests per unit time. It will not help if you need to also limit based on the size of the requests.
  </Warning>
</Accordion>

### Base URL or proxy

For many chat model integrations, you can configure the base URL for API requests, which allows you to use model providers that have OpenAI-compatible APIs or to use a proxy server.

<Accordion title="Base URL" icon="link">
  Many model providers offer OpenAI-compatible APIs (e.g., [Together AI](https://www.together.ai/), [vLLM](https://github.com/vllm-project/vllm)). You can use [`init_chat_model`](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model) with these providers by specifying the appropriate `base_url` parameter:

  ```python  theme={null}
  model = init_chat_model(
      model="MODEL_NAME",
      model_provider="openai",
      base_url="BASE_URL",
      api_key="YOUR_API_KEY",
  )
  ```

  <Note>
    When using direct chat model class instantiation, the parameter name may vary by provider. Check the respective [reference](/oss/python/integrations/providers/overview) for details.
  </Note>
</Accordion>

<Accordion title="Proxy configuration" icon="shield">
  For deployments requiring HTTP proxies, some model integrations support proxy configuration:

  ```python  theme={null}
  from langchain_openai import ChatOpenAI

  model = ChatOpenAI(
      model="gpt-4o",
      openai_proxy="http://proxy.example.com:8080"
  )
  ```

  <Note>
    Proxy support varies by integration. Check the specific model provider's [reference](/oss/python/integrations/providers/overview) for proxy configuration options.
  </Note>
</Accordion>

### Log probabilities

Certain models can be configured to return token-level log probabilities representing the likelihood of a given token by setting the `logprobs` parameter when initializing the model:

```python  theme={null}
model = init_chat_model(
    model="gpt-4o",
    model_provider="openai"
).bind(logprobs=True)

response = model.invoke("Why do parrots talk?")
print(response.response_metadata["logprobs"])
```

### Token usage

A number of model providers return token usage information as part of the invocation response. When available, this information will be included on the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) objects produced by the corresponding model. For more details, see the [messages](/oss/python/langchain/messages) guide.

<Note>
  Some provider APIs, notably OpenAI and Azure OpenAI chat completions, require users opt-in to receiving token usage data in streaming contexts. See the [streaming usage metadata](/oss/python/integrations/chat/openai#streaming-usage-metadata) section of the integration guide for details.
</Note>

You can track aggregate token counts across models in an application using either a callback or context manager, as shown below:

<Tabs>
  <Tab title="Callback handler">
    ```python  theme={null}
    from langchain.chat_models import init_chat_model
    from langchain_core.callbacks import UsageMetadataCallbackHandler

    model_1 = init_chat_model(model="gpt-4o-mini")
    model_2 = init_chat_model(model="claude-haiku-4-5-20251001")

    callback = UsageMetadataCallbackHandler()
    result_1 = model_1.invoke("Hello", config={"callbacks": [callback]})
    result_2 = model_2.invoke("Hello", config={"callbacks": [callback]})
    callback.usage_metadata
    ```

    ```python  theme={null}
    {
        'gpt-4o-mini-2024-07-18': {
            'input_tokens': 8,
            'output_tokens': 10,
            'total_tokens': 18,
            'input_token_details': {'audio': 0, 'cache_read': 0},
            'output_token_details': {'audio': 0, 'reasoning': 0}
        },
        'claude-haiku-4-5-20251001': {
            'input_tokens': 8,
            'output_tokens': 21,
            'total_tokens': 29,
            'input_token_details': {'cache_read': 0, 'cache_creation': 0}
        }
    }
    ```
  </Tab>

  <Tab title="Context manager">
    ```python  theme={null}
    from langchain.chat_models import init_chat_model
    from langchain_core.callbacks import get_usage_metadata_callback

    model_1 = init_chat_model(model="gpt-4o-mini")
    model_2 = init_chat_model(model="claude-haiku-4-5-20251001")

    with get_usage_metadata_callback() as cb:
        model_1.invoke("Hello")
        model_2.invoke("Hello")
        print(cb.usage_metadata)
    ```

    ```python  theme={null}
    {
        'gpt-4o-mini-2024-07-18': {
            'input_tokens': 8,
            'output_tokens': 10,
            'total_tokens': 18,
            'input_token_details': {'audio': 0, 'cache_read': 0},
            'output_token_details': {'audio': 0, 'reasoning': 0}
        },
        'claude-haiku-4-5-20251001': {
            'input_tokens': 8,
            'output_tokens': 21,
            'total_tokens': 29,
            'input_token_details': {'cache_read': 0, 'cache_creation': 0}
        }
    }
    ```
  </Tab>
</Tabs>

### Invocation config

When invoking a model, you can pass additional configuration through the `config` parameter using a [`RunnableConfig`](https://reference.langchain.com/python/langchain_core/runnables/#langchain_core.runnables.RunnableConfig) dictionary. This provides run-time control over execution behavior, callbacks, and metadata tracking.

Common configuration options include:

```python Invocation with config theme={null}
response = model.invoke(
    "Tell me a joke",
    config={
        "run_name": "joke_generation",      # Custom name for this run
        "tags": ["humor", "demo"],          # Tags for categorization
        "metadata": {"user_id": "123"},     # Custom metadata
        "callbacks": [my_callback_handler], # Callback handlers
    }
)
```

These configuration values are particularly useful when:

* Debugging with [LangSmith](https://docs.smith.langchain.com/) tracing
* Implementing custom logging or monitoring
* Controlling resource usage in production
* Tracking invocations across complex pipelines

<Accordion title="Key configuration attributes">
  <ParamField body="run_name" type="string">
    Identifies this specific invocation in logs and traces. Not inherited by sub-calls.
  </ParamField>

  <ParamField body="tags" type="string[]">
    Labels inherited by all sub-calls for filtering and organization in debugging tools.
  </ParamField>

  <ParamField body="metadata" type="object">
    Custom key-value pairs for tracking additional context, inherited by all sub-calls.
  </ParamField>

  <ParamField body="max_concurrency" type="number">
    Controls the maximum number of parallel calls when using [`batch()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch) or [`batch_as_completed()`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed).
  </ParamField>

  <ParamField body="callbacks" type="array">
    Handlers for monitoring and responding to events during execution.
  </ParamField>

  <ParamField body="recursion_limit" type="number">
    Maximum recursion depth for chains to prevent infinite loops in complex pipelines.
  </ParamField>
</Accordion>

<Tip>
  See full [`RunnableConfig`](https://reference.langchain.com/python/langchain_core/runnables/#langchain_core.runnables.RunnableConfig) reference for all supported attributes.
</Tip>

### Configurable models

You can also create a runtime-configurable model by specifying [`configurable_fields`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.configurable_fields). If you don't specify a model value, then `'model'` and `'model_provider'` will be configurable by default.

```python  theme={null}
from langchain.chat_models import init_chat_model

configurable_model = init_chat_model(temperature=0)

configurable_model.invoke(
    "what's your name",
    config={"configurable": {"model": "gpt-5-nano"}},  # Run with GPT-5-Nano
)
configurable_model.invoke(
    "what's your name",
    config={"configurable": {"model": "claude-sonnet-4-5-20250929"}},  # Run with Claude
)
```

<Accordion title="Configurable model with default values">
  We can create a configurable model with default model values, specify which parameters are configurable, and add prefixes to configurable params:

  ```python  theme={null}
  first_model = init_chat_model(
          model="gpt-4.1-mini",
          temperature=0,
          configurable_fields=("model", "model_provider", "temperature", "max_tokens"),
          config_prefix="first",  # Useful when you have a chain with multiple models
  )

  first_model.invoke("what's your name")
  ```

  ```python  theme={null}
  first_model.invoke(
      "what's your name",
      config={
          "configurable": {
              "first_model": "claude-sonnet-4-5-20250929",
              "first_temperature": 0.5,
              "first_max_tokens": 100,
          }
      },
  )
  ```
</Accordion>

<Accordion title="Using a configurable model declaratively">
  We can call declarative operations like `bind_tools`, `with_structured_output`, `with_configurable`, etc. on a configurable model and chain a configurable model in the same way that we would a regularly instantiated chat model object.

  ```python  theme={null}
  from pydantic import BaseModel, Field


  class GetWeather(BaseModel):
      """Get the current weather in a given location"""

          location: str = Field(..., description="The city and state, e.g. San Francisco, CA")


  class GetPopulation(BaseModel):
      """Get the current population in a given location"""

          location: str = Field(..., description="The city and state, e.g. San Francisco, CA")


  model = init_chat_model(temperature=0)
  model_with_tools = model.bind_tools([GetWeather, GetPopulation])

  model_with_tools.invoke(
      "what's bigger in 2024 LA or NYC", config={"configurable": {"model": "gpt-4.1-mini"}}
  ).tool_calls
  ```

  ```
  [
      {
          'name': 'GetPopulation',
          'args': {'location': 'Los Angeles, CA'},
          'id': 'call_Ga9m8FAArIyEjItHmztPYA22',
          'type': 'tool_call'
      },
      {
          'name': 'GetPopulation',
          'args': {'location': 'New York, NY'},
          'id': 'call_jh2dEvBaAHRaw5JUDthOs7rt',
          'type': 'tool_call'
      }
  ]
  ```

  ```python  theme={null}
  model_with_tools.invoke(
      "what's bigger in 2024 LA or NYC",
      config={"configurable": {"model": "claude-sonnet-4-5-20250929"}},
  ).tool_calls
  ```

  ```
  [
      {
          'name': 'GetPopulation',
          'args': {'location': 'Los Angeles, CA'},
          'id': 'toolu_01JMufPf4F4t2zLj7miFeqXp',
          'type': 'tool_call'
      },
      {
          'name': 'GetPopulation',
          'args': {'location': 'New York City, NY'},
          'id': 'toolu_01RQBHcE8kEEbYTuuS8WqY1u',
          'type': 'tool_call'
      }
  ]
  ```
</Accordion>

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/models.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Messages

Messages are the fundamental unit of context for models in LangChain. They represent the input and output of models, carrying both the content and metadata needed to represent the state of a conversation when interacting with an LLM.

Messages are objects that contain:

* <Icon icon="user" size={16} /> [**Role**](#message-types) - Identifies the message type (e.g. `system`, `user`)
* <Icon icon="folder-closed" size={16} /> [**Content**](#message-content) - Represents the actual content of the message (like text, images, audio, documents, etc.)
* <Icon icon="tag" size={16} /> [**Metadata**](#message-metadata) - Optional fields such as response information, message IDs, and token usage

LangChain provides a standard message type that works across all model providers, ensuring consistent behavior regardless of the model being called.

## Basic usage

The simplest way to use messages is to create message objects and pass them to a model when [invoking](/oss/python/langchain/models#invocation).

```python  theme={null}
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, AIMessage, SystemMessage

model = init_chat_model("gpt-5-nano")

system_msg = SystemMessage("You are a helpful assistant.")
human_msg = HumanMessage("Hello, how are you?")

# Use with chat models
messages = [system_msg, human_msg]
response = model.invoke(messages)  # Returns AIMessage
```

### Text prompts

Text prompts are strings - ideal for straightforward generation tasks where you don't need to retain conversation history.

```python  theme={null}
response = model.invoke("Write a haiku about spring")
```

**Use text prompts when:**

* You have a single, standalone request
* You don't need conversation history
* You want minimal code complexity

### Message prompts

Alternatively, you can pass in a list of messages to the model by providing a list of message objects.

```python  theme={null}
from langchain.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage("You are a poetry expert"),
    HumanMessage("Write a haiku about spring"),
    AIMessage("Cherry blossoms bloom...")
]
response = model.invoke(messages)
```

**Use message prompts when:**

* Managing multi-turn conversations
* Working with multimodal content (images, audio, files)
* Including system instructions

### Dictionary format

You can also specify messages directly in OpenAI chat completions format.

```python  theme={null}
messages = [
    {"role": "system", "content": "You are a poetry expert"},
    {"role": "user", "content": "Write a haiku about spring"},
    {"role": "assistant", "content": "Cherry blossoms bloom..."}
]
response = model.invoke(messages)
```

## Message types

* <Icon icon="gear" size={16} /> [System message](#system-message) - Tells the model how to behave and provide context for interactions
* <Icon icon="user" size={16} /> [Human message](#human-message) - Represents user input and interactions with the model
* <Icon icon="robot" size={16} /> [AI message](#ai-message) - Responses generated by the model, including text content, tool calls, and metadata
* <Icon icon="wrench" size={16} /> [Tool message](#tool-message) - Represents the outputs of [tool calls](/oss/python/langchain/models#tool-calling)

### System Message

A [`SystemMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.SystemMessage) represent an initial set of instructions that primes the model's behavior. You can use a system message to set the tone, define the model's role, and establish guidelines for responses.

```python Basic instructions theme={null}
system_msg = SystemMessage("You are a helpful coding assistant.")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

```python Detailed persona theme={null}
from langchain.messages import SystemMessage, HumanMessage

system_msg = SystemMessage("""
You are a senior Python developer with expertise in web frameworks.
Always provide code examples and explain your reasoning.
Be concise but thorough in your explanations.
""")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

***

### Human Message

A [`HumanMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.HumanMessage) represents user input and interactions. They can contain text, images, audio, files, and any other amount of multimodal [content](#message-content).

#### Text content

<CodeGroup>
  ```python Message object theme={null}
  response = model.invoke([
    HumanMessage("What is machine learning?")
  ])
  ```

  ```python String shortcut theme={null}
  # Using a string is a shortcut for a single HumanMessage
  response = model.invoke("What is machine learning?")
  ```
</CodeGroup>

#### Message metadata

```python Add metadata theme={null}
human_msg = HumanMessage(
    content="Hello!",
    name="alice",  # Optional: identify different users
    id="msg_123",  # Optional: unique identifier for tracing
)
```

<Note>
  The `name` field behavior varies by provider - some use it for user identification, others ignore it. To check, refer to the model provider's [reference](https://reference.langchain.com/python/integrations/).
</Note>

***

### AI Message

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) represents the output of a model invocation. They can include multimodal data, tool calls, and provider-specific metadata that you can later access.

```python  theme={null}
response = model.invoke("Explain AI")
print(type(response))  # <class 'langchain_core.messages.ai.AIMessage'>
```

[`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) objects are returned by the model when calling it, which contains all of the associated metadata in the response.

Providers weigh/contextualize types of messages differently, which means it is sometimes helpful to manually create a new [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) object and insert it into the message history as if it came from the model.

```python  theme={null}
from langchain.messages import AIMessage, SystemMessage, HumanMessage

# Create an AI message manually (e.g., for conversation history)
ai_msg = AIMessage("I'd be happy to help you with that question!")

# Add to conversation history
messages = [
    SystemMessage("You are a helpful assistant"),
    HumanMessage("Can you help me?"),
    ai_msg,  # Insert as if it came from the model
    HumanMessage("Great! What's 2+2?")
]

response = model.invoke(messages)
```

<Accordion title="Attributes">
  <ParamField path="text" type="string">
    The text content of the message.
  </ParamField>

  <ParamField path="content" type="string | dict[]">
    The raw content of the message.
  </ParamField>

  <ParamField path="content_blocks" type="ContentBlock[]">
    The standardized [content blocks](#message-content) of the message.
  </ParamField>

  <ParamField path="tool_calls" type="dict[] | None">
    The tool calls made by the model. Empty if no tools are called.
  </ParamField>

  <ParamField path="id" type="string">
    A unique identifier for the message (either automatically generated by LangChain or returned in the provider response)
  </ParamField>

  <ParamField path="usage_metadata" type="dict | None">
    The usage metadata of the message, which can contain token counts when available.
  </ParamField>

  <ParamField path="response_metadata" type="ResponseMetadata | None">
    The response metadata of the message.
  </ParamField>
</Accordion>

#### Tool calls

When models make [tool calls](/oss/python/langchain/models#tool-calling), they're included in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage):

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

def get_weather(location: str) -> str:
    """Get the weather at a location."""
    ...

model_with_tools = model.bind_tools([get_weather])
response = model_with_tools.invoke("What's the weather in Paris?")

for tool_call in response.tool_calls:
    print(f"Tool: {tool_call['name']}")
    print(f"Args: {tool_call['args']}")
    print(f"ID: {tool_call['id']}")
```

Other structured data, such as reasoning or citations, can also appear in message [content](/oss/python/langchain/messages#message-content).

#### Token usage

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) can hold token counts and other usage metadata in its [`usage_metadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) field:

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

response = model.invoke("Hello!")
response.usage_metadata
```

```
{'input_tokens': 8,
 'output_tokens': 304,
 'total_tokens': 312,
 'input_token_details': {'audio': 0, 'cache_read': 0},
 'output_token_details': {'audio': 0, 'reasoning': 256}}
```

See [`UsageMetadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) for details.

#### Streaming and chunks

During streaming, you'll receive [`AIMessageChunk`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessageChunk) objects that can be combined into a full message object:

```python  theme={null}
chunks = []
full_message = None
for chunk in model.stream("Hi"):
    chunks.append(chunk)
    print(chunk.text)
    full_message = chunk if full_message is None else full_message + chunk
```

<Note>
  Learn more:

  * [Streaming tokens from chat models](/oss/python/langchain/models#stream)
  * [Streaming tokens and/or steps from agents](/oss/python/langchain/streaming)
</Note>

***

### Tool Message

For models that support [tool calling](/oss/python/langchain/models#tool-calling), AI messages can contain tool calls. Tool messages are used to pass the results of a single tool execution back to the model.

[Tools](/oss/python/langchain/tools) can generate [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) objects directly. Below, we show a simple example. Read more in the [tools guide](/oss/python/langchain/tools).

```python  theme={null}
# After a model makes a tool call
ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "San Francisco"},
        "id": "call_123"
    }]
)

# Execute tool and create result message
weather_result = "Sunny, 72°F"
tool_message = ToolMessage(
    content=weather_result,
    tool_call_id="call_123"  # Must match the call ID
)

# Continue conversation
messages = [
    HumanMessage("What's the weather in San Francisco?"),
    ai_message,  # Model's tool call
    tool_message,  # Tool execution result
]
response = model.invoke(messages)  # Model processes the result
```

<Accordion title="Attributes">
  <ParamField path="content" type="string" required>
    The stringified output of the tool call.
  </ParamField>

  <ParamField path="tool_call_id" type="string" required>
    The ID of the tool call that this message is responding to. (this must match the ID of the tool call in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage))
  </ParamField>

  <ParamField path="name" type="string" required>
    The name of the tool that was called.
  </ParamField>

  <ParamField path="artifact" type="dict">
    Additional data not sent to the model but can be accessed programmatically.
  </ParamField>
</Accordion>

<Note>
  The `artifact` field stores supplementary data that won't be sent to the model but can be accessed programmatically. This is useful for storing raw results, debugging information, or data for downstream processing without cluttering the model's context.

  <Accordion title="Example: Using artifact for retrieval metadata">
    For example, a [retrieval](/oss/python/langchain/retrieval) tool could retrieve a passage from a document for reference by a model. Where message `content` contains text that the model will reference, an `artifact` can contain document identifiers or other metadata that an application can use (e.g., to render a page). See example below:

    ```python  theme={null}
    from langchain.messages import ToolMessage

    # Sent to model
    message_content = "It was the best of times, it was the worst of times."

    # Artifact available downstream
    artifact = {"document_id": "doc_123", "page": 0}

    tool_message = ToolMessage(
        content=message_content,
        tool_call_id="call_123",
        name="search_books",
        artifact=artifact,
    )
    ```

    See the [RAG tutorial](/oss/python/langchain/rag) for an end-to-end example of building retrieval [agents](/oss/python/langchain/agents) with LangChain.
  </Accordion>
</Note>

***

## Message content

You can think of a message's content as the payload of data that gets sent to the model. Messages have a `content` attribute that is loosely-typed, supporting strings and lists of untyped objects (e.g., dictionaries). This allows support for provider-native structures directly in LangChain chat models, such as [multimodal](#multimodal) content and other data.

Separately, LangChain provides dedicated content types for text, reasoning, citations, multi-modal data, server-side tool calls, and other message content. See [content blocks](#standard-content-blocks) below.

LangChain chat models accept message content in the `content` attribute, and can contain:

1. A string
2. A list of content blocks in a provider-native format
3. A list of [LangChain's standard content blocks](#standard-content-blocks)

See below for an example using [multimodal](#multimodal) inputs:

```python  theme={null}
from langchain.messages import HumanMessage

# String content
human_message = HumanMessage("Hello, how are you?")

# Provider-native format (e.g., OpenAI)
human_message = HumanMessage(content=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
])

# List of standard content blocks
human_message = HumanMessage(content_blocks=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image", "url": "https://example.com/image.jpg"},
])
```

<Tip>
  Specifying `content_blocks` when initializing a message will still populate message
  `content`, but provides a type-safe interface for doing so.
</Tip>

### Standard content blocks

LangChain provides a standard representation for message content that works across providers.

Message objects implement a `content_blocks` property that will lazily parse the `content` attribute into a standard, type-safe representation. For example, messages generated from [ChatAnthropic](/oss/python/integrations/chat/anthropic) or [ChatOpenAI](/oss/python/integrations/chat/openai) will include `thinking` or `reasoning` blocks in the format of the respective provider, but can be lazily parsed into a consistent [`ReasoningContentBlock`](#content-block-reference) representation:

<Tabs>
  <Tab title="Anthropic">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {"type": "thinking", "thinking": "...", "signature": "WaUjzkyp..."},
            {"type": "text", "text": "..."},
        ],
        response_metadata={"model_provider": "anthropic"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning',
      'reasoning': '...',
      'extras': {'signature': 'WaUjzkyp...'}},
     {'type': 'text', 'text': '...'}]
    ```
  </Tab>

  <Tab title="OpenAI">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {
                "type": "reasoning",
                "id": "rs_abc123",
                "summary": [
                    {"type": "summary_text", "text": "summary 1"},
                    {"type": "summary_text", "text": "summary 2"},
                ],
            },
            {"type": "text", "text": "...", "id": "msg_abc123"},
        ],
        response_metadata={"model_provider": "openai"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 1'},
     {'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 2'},
     {'type': 'text', 'text': '...', 'id': 'msg_abc123'}]
    ```
  </Tab>
</Tabs>

See the [integrations guides](/oss/python/integrations/providers/overview) to get started with the
inference provider of your choice.

<Note>
  **Serializing standard content**

  If an application outside of LangChain needs access to the standard content block
  representation, you can opt-in to storing content blocks in message content.

  To do this, you can set the `LC_OUTPUT_VERSION` environment variable to `v1`. Or,
  initialize any chat model with `output_version="v1"`:

  ```python  theme={null}
  from langchain.chat_models import init_chat_model

  model = init_chat_model("gpt-5-nano", output_version="v1")
  ```
</Note>

### Multimodal

**Multimodality** refers to the ability to work with data that comes in different
forms, such as text, audio, images, and video. LangChain includes standard types
for these data that can be used across providers.

[Chat models](/oss/python/langchain/models) can accept multimodal data as input and generate
it as output. Below we show short examples of input messages featuring multimodal data.

<Note>
  Extra keys can be included top-level in the content block or nested in `"extras": {"key": value}`.

  [OpenAI](/oss/python/integrations/chat/openai#pdfs) and [AWS Bedrock Converse](/oss/python/integrations/chat/bedrock),
  for example, require a filename for PDFs. See the [provider page](/oss/python/integrations/providers/overview)
  for your chosen model for specifics.
</Note>

<CodeGroup>
  ```python Image input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "url": "https://example.com/path/to/image.jpg"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {
              "type": "image",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "image/jpeg",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python PDF document input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "url": "https://example.com/path/to/document.pdf"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {
              "type": "file",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "application/pdf",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Audio input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {
              "type": "audio",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "audio/wav",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {"type": "audio", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Video input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {
              "type": "video",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "video/mp4",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {"type": "video", "file_id": "file-abc123"},
      ]
  }
  ```
</CodeGroup>

<Warning>
  Not all models support all file types. Check the model provider's [reference](https://reference.langchain.com/python/integrations/) for supported formats and size limits.
</Warning>

### Content block reference

Content blocks are represented (either when creating a message or accessing the `content_blocks` property) as a list of typed dictionaries. Each item in the list must adhere to one of the following block types:

<AccordionGroup>
  <Accordion title="Core" icon="cube">
    <AccordionGroup>
      <Accordion title="TextContentBlock" icon="text">
        **Purpose:** Standard text output

        <ParamField body="type" type="string" required>
          Always `"text"`
        </ParamField>

        <ParamField body="text" type="string" required>
          The text content
        </ParamField>

        <ParamField body="annotations" type="object[]">
          List of annotations for the text
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "text",
            "text": "Hello world",
            "annotations": []
        }
        ```
      </Accordion>

      <Accordion title="ReasoningContentBlock" icon="brain">
        **Purpose:** Model reasoning steps

        <ParamField body="type" type="string" required>
          Always `"reasoning"`
        </ParamField>

        <ParamField body="reasoning" type="string">
          The reasoning content
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "reasoning",
            "reasoning": "The user is asking about...",
            "extras": {"signature": "abc123"},
        }
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Multimodal" icon="images">
    <AccordionGroup>
      <Accordion title="ImageContentBlock" icon="image">
        **Purpose:** Image data

        <ParamField body="type" type="string" required>
          Always `"image"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the image location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded image data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored image (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Image [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#image) (e.g., `image/jpeg`, `image/png`)
        </ParamField>
      </Accordion>

      <Accordion title="AudioContentBlock" icon="volume-high">
        **Purpose:** Audio data

        <ParamField body="type" type="string" required>
          Always `"audio"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the audio location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded audio data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored audio file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Audio [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#audio) (e.g., `audio/mpeg`, `audio/wav`)
        </ParamField>
      </Accordion>

      <Accordion title="VideoContentBlock" icon="video">
        **Purpose:** Video data

        <ParamField body="type" type="string" required>
          Always `"video"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the video location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded video data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored video file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Video [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#video) (e.g., `video/mp4`, `video/webm`)
        </ParamField>
      </Accordion>

      <Accordion title="FileContentBlock" icon="file">
        **Purpose:** Generic files (PDF, etc)

        <ParamField body="type" type="string" required>
          Always `"file"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the file location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded file data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          File [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) (e.g., `application/pdf`)
        </ParamField>
      </Accordion>

      <Accordion title="PlainTextContentBlock" icon="align-left">
        **Purpose:** Document text (`.txt`, `.md`)

        <ParamField body="type" type="string" required>
          Always `"text-plain"`
        </ParamField>

        <ParamField body="text" type="string">
          The text content
        </ParamField>

        <ParamField body="mime_type" type="string">
          [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) of the text (e.g., `text/plain`, `text/markdown`)
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Tool Calling" icon="wrench">
    <AccordionGroup>
      <Accordion title="ToolCall" icon="function">
        **Purpose:** Function calls

        <ParamField body="type" type="string" required>
          Always `"tool_call"`
        </ParamField>

        <ParamField body="name" type="string" required>
          Name of the tool to call
        </ParamField>

        <ParamField body="args" type="object" required>
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="id" type="string" required>
          Unique identifier for this tool call
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "tool_call",
            "name": "search",
            "args": {"query": "weather"},
            "id": "call_123"
        }
        ```
      </Accordion>

      <Accordion title="ToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming tool call fragments

        <ParamField body="type" type="string" required>
          Always `"tool_call_chunk"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="id" type="string">
          Tool call identifier
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="InvalidToolCall" icon="triangle-exclamation">
        **Purpose:** Malformed calls, intended to catch JSON parsing errors.

        <ParamField body="type" type="string" required>
          Always `"invalid_tool_call"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool that failed to be called
        </ParamField>

        <ParamField body="args" type="object">
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="error" type="string">
          Description of what went wrong
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Server-Side Tool Execution" icon="server">
    <AccordionGroup>
      <Accordion title="ServerToolCall" icon="wrench">
        **Purpose:** Tool call that is executed server-side.

        <ParamField body="type" type="string" required>
          Always `"server_tool_call"`
        </ParamField>

        <ParamField body="id" type="string" required>
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string" required>
          The name of the tool to be called.
        </ParamField>

        <ParamField body="args" type="string" required>
          Partial tool arguments (may be incomplete JSON)
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming server-side tool call fragments

        <ParamField body="type" type="string" required>
          Always `"server_tool_call_chunk"`
        </ParamField>

        <ParamField body="id" type="string">
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolResult" icon="box-open">
        **Purpose:** Search results

        <ParamField body="type" type="string" required>
          Always `"server_tool_result"`
        </ParamField>

        <ParamField body="tool_call_id" type="string" required>
          Identifier of the corresponding server tool call.
        </ParamField>

        <ParamField body="id" type="string">
          Identifier associated with the server tool result.
        </ParamField>

        <ParamField body="status" type="string" required>
          Execution status of the server-side tool. `"success"` or `"error"`.
        </ParamField>

        <ParamField body="output">
          Output of the executed tool.
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Provider-Specific Blocks" icon="plug">
    <Accordion title="NonStandardContentBlock" icon="asterisk">
      **Purpose:** Provider-specific escape hatch

      <ParamField body="type" type="string" required>
        Always `"non_standard"`
      </ParamField>

      <ParamField body="value" type="object" required>
        Provider-specific data structure
      </ParamField>

      **Usage:** For experimental or provider-unique features
    </Accordion>

    Additional provider-specific content types may be found within the [reference documentation](/oss/python/integrations/providers/overview) of each model provider.
  </Accordion>
</AccordionGroup>

<Tip>
  View the canonical type definitions in the [API reference](https://reference.langchain.com/python/langchain/messages).
</Tip>

<Info>
  Content blocks were introduced as a new property on messages in LangChain v1 to standardize content formats across providers while maintaining backward compatibility with existing code. Content blocks are not a replacement for the [`content`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.messages.BaseMessage.content) property, but rather a new property that can be used to access the content of a message in a standardized format.
</Info>

## Use with chat models

[Chat models](/oss/python/langchain/models) accept a sequence of message objects as input and return an [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) as output. Interactions are often stateless, so that a simple conversational loop involves invoking a model with a growing list of messages.

Refer to the below guides to learn more:

* Built-in features for [persisting and managing conversation histories](/oss/python/langchain/short-term-memory)
* Strategies for managing context windows, including [trimming and summarizing messages](/oss/python/langchain/short-term-memory#common-patterns)

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/messages.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Messages

Messages are the fundamental unit of context for models in LangChain. They represent the input and output of models, carrying both the content and metadata needed to represent the state of a conversation when interacting with an LLM.

Messages are objects that contain:

* <Icon icon="user" size={16} /> [**Role**](#message-types) - Identifies the message type (e.g. `system`, `user`)
* <Icon icon="folder-closed" size={16} /> [**Content**](#message-content) - Represents the actual content of the message (like text, images, audio, documents, etc.)
* <Icon icon="tag" size={16} /> [**Metadata**](#message-metadata) - Optional fields such as response information, message IDs, and token usage

LangChain provides a standard message type that works across all model providers, ensuring consistent behavior regardless of the model being called.

## Basic usage

The simplest way to use messages is to create message objects and pass them to a model when [invoking](/oss/python/langchain/models#invocation).

```python  theme={null}
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, AIMessage, SystemMessage

model = init_chat_model("gpt-5-nano")

system_msg = SystemMessage("You are a helpful assistant.")
human_msg = HumanMessage("Hello, how are you?")

# Use with chat models
messages = [system_msg, human_msg]
response = model.invoke(messages)  # Returns AIMessage
```

### Text prompts

Text prompts are strings - ideal for straightforward generation tasks where you don't need to retain conversation history.

```python  theme={null}
response = model.invoke("Write a haiku about spring")
```

**Use text prompts when:**

* You have a single, standalone request
* You don't need conversation history
* You want minimal code complexity

### Message prompts

Alternatively, you can pass in a list of messages to the model by providing a list of message objects.

```python  theme={null}
from langchain.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage("You are a poetry expert"),
    HumanMessage("Write a haiku about spring"),
    AIMessage("Cherry blossoms bloom...")
]
response = model.invoke(messages)
```

**Use message prompts when:**

* Managing multi-turn conversations
* Working with multimodal content (images, audio, files)
* Including system instructions

### Dictionary format

You can also specify messages directly in OpenAI chat completions format.

```python  theme={null}
messages = [
    {"role": "system", "content": "You are a poetry expert"},
    {"role": "user", "content": "Write a haiku about spring"},
    {"role": "assistant", "content": "Cherry blossoms bloom..."}
]
response = model.invoke(messages)
```

## Message types

* <Icon icon="gear" size={16} /> [System message](#system-message) - Tells the model how to behave and provide context for interactions
* <Icon icon="user" size={16} /> [Human message](#human-message) - Represents user input and interactions with the model
* <Icon icon="robot" size={16} /> [AI message](#ai-message) - Responses generated by the model, including text content, tool calls, and metadata
* <Icon icon="wrench" size={16} /> [Tool message](#tool-message) - Represents the outputs of [tool calls](/oss/python/langchain/models#tool-calling)

### System Message

A [`SystemMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.SystemMessage) represent an initial set of instructions that primes the model's behavior. You can use a system message to set the tone, define the model's role, and establish guidelines for responses.

```python Basic instructions theme={null}
system_msg = SystemMessage("You are a helpful coding assistant.")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

```python Detailed persona theme={null}
from langchain.messages import SystemMessage, HumanMessage

system_msg = SystemMessage("""
You are a senior Python developer with expertise in web frameworks.
Always provide code examples and explain your reasoning.
Be concise but thorough in your explanations.
""")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

***

### Human Message

A [`HumanMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.HumanMessage) represents user input and interactions. They can contain text, images, audio, files, and any other amount of multimodal [content](#message-content).

#### Text content

<CodeGroup>
  ```python Message object theme={null}
  response = model.invoke([
    HumanMessage("What is machine learning?")
  ])
  ```

  ```python String shortcut theme={null}
  # Using a string is a shortcut for a single HumanMessage
  response = model.invoke("What is machine learning?")
  ```
</CodeGroup>

#### Message metadata

```python Add metadata theme={null}
human_msg = HumanMessage(
    content="Hello!",
    name="alice",  # Optional: identify different users
    id="msg_123",  # Optional: unique identifier for tracing
)
```

<Note>
  The `name` field behavior varies by provider - some use it for user identification, others ignore it. To check, refer to the model provider's [reference](https://reference.langchain.com/python/integrations/).
</Note>

***

### AI Message

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) represents the output of a model invocation. They can include multimodal data, tool calls, and provider-specific metadata that you can later access.

```python  theme={null}
response = model.invoke("Explain AI")
print(type(response))  # <class 'langchain_core.messages.ai.AIMessage'>
```

[`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) objects are returned by the model when calling it, which contains all of the associated metadata in the response.

Providers weigh/contextualize types of messages differently, which means it is sometimes helpful to manually create a new [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) object and insert it into the message history as if it came from the model.

```python  theme={null}
from langchain.messages import AIMessage, SystemMessage, HumanMessage

# Create an AI message manually (e.g., for conversation history)
ai_msg = AIMessage("I'd be happy to help you with that question!")

# Add to conversation history
messages = [
    SystemMessage("You are a helpful assistant"),
    HumanMessage("Can you help me?"),
    ai_msg,  # Insert as if it came from the model
    HumanMessage("Great! What's 2+2?")
]

response = model.invoke(messages)
```

<Accordion title="Attributes">
  <ParamField path="text" type="string">
    The text content of the message.
  </ParamField>

  <ParamField path="content" type="string | dict[]">
    The raw content of the message.
  </ParamField>

  <ParamField path="content_blocks" type="ContentBlock[]">
    The standardized [content blocks](#message-content) of the message.
  </ParamField>

  <ParamField path="tool_calls" type="dict[] | None">
    The tool calls made by the model. Empty if no tools are called.
  </ParamField>

  <ParamField path="id" type="string">
    A unique identifier for the message (either automatically generated by LangChain or returned in the provider response)
  </ParamField>

  <ParamField path="usage_metadata" type="dict | None">
    The usage metadata of the message, which can contain token counts when available.
  </ParamField>

  <ParamField path="response_metadata" type="ResponseMetadata | None">
    The response metadata of the message.
  </ParamField>
</Accordion>

#### Tool calls

When models make [tool calls](/oss/python/langchain/models#tool-calling), they're included in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage):

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

def get_weather(location: str) -> str:
    """Get the weather at a location."""
    ...

model_with_tools = model.bind_tools([get_weather])
response = model_with_tools.invoke("What's the weather in Paris?")

for tool_call in response.tool_calls:
    print(f"Tool: {tool_call['name']}")
    print(f"Args: {tool_call['args']}")
    print(f"ID: {tool_call['id']}")
```

Other structured data, such as reasoning or citations, can also appear in message [content](/oss/python/langchain/messages#message-content).

#### Token usage

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) can hold token counts and other usage metadata in its [`usage_metadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) field:

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

response = model.invoke("Hello!")
response.usage_metadata
```

```
{'input_tokens': 8,
 'output_tokens': 304,
 'total_tokens': 312,
 'input_token_details': {'audio': 0, 'cache_read': 0},
 'output_token_details': {'audio': 0, 'reasoning': 256}}
```

See [`UsageMetadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) for details.

#### Streaming and chunks

During streaming, you'll receive [`AIMessageChunk`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessageChunk) objects that can be combined into a full message object:

```python  theme={null}
chunks = []
full_message = None
for chunk in model.stream("Hi"):
    chunks.append(chunk)
    print(chunk.text)
    full_message = chunk if full_message is None else full_message + chunk
```

<Note>
  Learn more:

  * [Streaming tokens from chat models](/oss/python/langchain/models#stream)
  * [Streaming tokens and/or steps from agents](/oss/python/langchain/streaming)
</Note>

***

### Tool Message

For models that support [tool calling](/oss/python/langchain/models#tool-calling), AI messages can contain tool calls. Tool messages are used to pass the results of a single tool execution back to the model.

[Tools](/oss/python/langchain/tools) can generate [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) objects directly. Below, we show a simple example. Read more in the [tools guide](/oss/python/langchain/tools).

```python  theme={null}
# After a model makes a tool call
ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "San Francisco"},
        "id": "call_123"
    }]
)

# Execute tool and create result message
weather_result = "Sunny, 72°F"
tool_message = ToolMessage(
    content=weather_result,
    tool_call_id="call_123"  # Must match the call ID
)

# Continue conversation
messages = [
    HumanMessage("What's the weather in San Francisco?"),
    ai_message,  # Model's tool call
    tool_message,  # Tool execution result
]
response = model.invoke(messages)  # Model processes the result
```

<Accordion title="Attributes">
  <ParamField path="content" type="string" required>
    The stringified output of the tool call.
  </ParamField>

  <ParamField path="tool_call_id" type="string" required>
    The ID of the tool call that this message is responding to. (this must match the ID of the tool call in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage))
  </ParamField>

  <ParamField path="name" type="string" required>
    The name of the tool that was called.
  </ParamField>

  <ParamField path="artifact" type="dict">
    Additional data not sent to the model but can be accessed programmatically.
  </ParamField>
</Accordion>

<Note>
  The `artifact` field stores supplementary data that won't be sent to the model but can be accessed programmatically. This is useful for storing raw results, debugging information, or data for downstream processing without cluttering the model's context.

  <Accordion title="Example: Using artifact for retrieval metadata">
    For example, a [retrieval](/oss/python/langchain/retrieval) tool could retrieve a passage from a document for reference by a model. Where message `content` contains text that the model will reference, an `artifact` can contain document identifiers or other metadata that an application can use (e.g., to render a page). See example below:

    ```python  theme={null}
    from langchain.messages import ToolMessage

    # Sent to model
    message_content = "It was the best of times, it was the worst of times."

    # Artifact available downstream
    artifact = {"document_id": "doc_123", "page": 0}

    tool_message = ToolMessage(
        content=message_content,
        tool_call_id="call_123",
        name="search_books",
        artifact=artifact,
    )
    ```

    See the [RAG tutorial](/oss/python/langchain/rag) for an end-to-end example of building retrieval [agents](/oss/python/langchain/agents) with LangChain.
  </Accordion>
</Note>

***

## Message content

You can think of a message's content as the payload of data that gets sent to the model. Messages have a `content` attribute that is loosely-typed, supporting strings and lists of untyped objects (e.g., dictionaries). This allows support for provider-native structures directly in LangChain chat models, such as [multimodal](#multimodal) content and other data.

Separately, LangChain provides dedicated content types for text, reasoning, citations, multi-modal data, server-side tool calls, and other message content. See [content blocks](#standard-content-blocks) below.

LangChain chat models accept message content in the `content` attribute, and can contain:

1. A string
2. A list of content blocks in a provider-native format
3. A list of [LangChain's standard content blocks](#standard-content-blocks)

See below for an example using [multimodal](#multimodal) inputs:

```python  theme={null}
from langchain.messages import HumanMessage

# String content
human_message = HumanMessage("Hello, how are you?")

# Provider-native format (e.g., OpenAI)
human_message = HumanMessage(content=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
])

# List of standard content blocks
human_message = HumanMessage(content_blocks=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image", "url": "https://example.com/image.jpg"},
])
```

<Tip>
  Specifying `content_blocks` when initializing a message will still populate message
  `content`, but provides a type-safe interface for doing so.
</Tip>

### Standard content blocks

LangChain provides a standard representation for message content that works across providers.

Message objects implement a `content_blocks` property that will lazily parse the `content` attribute into a standard, type-safe representation. For example, messages generated from [ChatAnthropic](/oss/python/integrations/chat/anthropic) or [ChatOpenAI](/oss/python/integrations/chat/openai) will include `thinking` or `reasoning` blocks in the format of the respective provider, but can be lazily parsed into a consistent [`ReasoningContentBlock`](#content-block-reference) representation:

<Tabs>
  <Tab title="Anthropic">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {"type": "thinking", "thinking": "...", "signature": "WaUjzkyp..."},
            {"type": "text", "text": "..."},
        ],
        response_metadata={"model_provider": "anthropic"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning',
      'reasoning': '...',
      'extras': {'signature': 'WaUjzkyp...'}},
     {'type': 'text', 'text': '...'}]
    ```
  </Tab>

  <Tab title="OpenAI">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {
                "type": "reasoning",
                "id": "rs_abc123",
                "summary": [
                    {"type": "summary_text", "text": "summary 1"},
                    {"type": "summary_text", "text": "summary 2"},
                ],
            },
            {"type": "text", "text": "...", "id": "msg_abc123"},
        ],
        response_metadata={"model_provider": "openai"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 1'},
     {'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 2'},
     {'type': 'text', 'text': '...', 'id': 'msg_abc123'}]
    ```
  </Tab>
</Tabs>

See the [integrations guides](/oss/python/integrations/providers/overview) to get started with the
inference provider of your choice.

<Note>
  **Serializing standard content**

  If an application outside of LangChain needs access to the standard content block
  representation, you can opt-in to storing content blocks in message content.

  To do this, you can set the `LC_OUTPUT_VERSION` environment variable to `v1`. Or,
  initialize any chat model with `output_version="v1"`:

  ```python  theme={null}
  from langchain.chat_models import init_chat_model

  model = init_chat_model("gpt-5-nano", output_version="v1")
  ```
</Note>

### Multimodal

**Multimodality** refers to the ability to work with data that comes in different
forms, such as text, audio, images, and video. LangChain includes standard types
for these data that can be used across providers.

[Chat models](/oss/python/langchain/models) can accept multimodal data as input and generate
it as output. Below we show short examples of input messages featuring multimodal data.

<Note>
  Extra keys can be included top-level in the content block or nested in `"extras": {"key": value}`.

  [OpenAI](/oss/python/integrations/chat/openai#pdfs) and [AWS Bedrock Converse](/oss/python/integrations/chat/bedrock),
  for example, require a filename for PDFs. See the [provider page](/oss/python/integrations/providers/overview)
  for your chosen model for specifics.
</Note>

<CodeGroup>
  ```python Image input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "url": "https://example.com/path/to/image.jpg"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {
              "type": "image",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "image/jpeg",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python PDF document input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "url": "https://example.com/path/to/document.pdf"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {
              "type": "file",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "application/pdf",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Audio input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {
              "type": "audio",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "audio/wav",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {"type": "audio", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Video input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {
              "type": "video",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "video/mp4",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {"type": "video", "file_id": "file-abc123"},
      ]
  }
  ```
</CodeGroup>

<Warning>
  Not all models support all file types. Check the model provider's [reference](https://reference.langchain.com/python/integrations/) for supported formats and size limits.
</Warning>

### Content block reference

Content blocks are represented (either when creating a message or accessing the `content_blocks` property) as a list of typed dictionaries. Each item in the list must adhere to one of the following block types:

<AccordionGroup>
  <Accordion title="Core" icon="cube">
    <AccordionGroup>
      <Accordion title="TextContentBlock" icon="text">
        **Purpose:** Standard text output

        <ParamField body="type" type="string" required>
          Always `"text"`
        </ParamField>

        <ParamField body="text" type="string" required>
          The text content
        </ParamField>

        <ParamField body="annotations" type="object[]">
          List of annotations for the text
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "text",
            "text": "Hello world",
            "annotations": []
        }
        ```
      </Accordion>

      <Accordion title="ReasoningContentBlock" icon="brain">
        **Purpose:** Model reasoning steps

        <ParamField body="type" type="string" required>
          Always `"reasoning"`
        </ParamField>

        <ParamField body="reasoning" type="string">
          The reasoning content
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "reasoning",
            "reasoning": "The user is asking about...",
            "extras": {"signature": "abc123"},
        }
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Multimodal" icon="images">
    <AccordionGroup>
      <Accordion title="ImageContentBlock" icon="image">
        **Purpose:** Image data

        <ParamField body="type" type="string" required>
          Always `"image"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the image location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded image data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored image (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Image [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#image) (e.g., `image/jpeg`, `image/png`)
        </ParamField>
      </Accordion>

      <Accordion title="AudioContentBlock" icon="volume-high">
        **Purpose:** Audio data

        <ParamField body="type" type="string" required>
          Always `"audio"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the audio location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded audio data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored audio file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Audio [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#audio) (e.g., `audio/mpeg`, `audio/wav`)
        </ParamField>
      </Accordion>

      <Accordion title="VideoContentBlock" icon="video">
        **Purpose:** Video data

        <ParamField body="type" type="string" required>
          Always `"video"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the video location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded video data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored video file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Video [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#video) (e.g., `video/mp4`, `video/webm`)
        </ParamField>
      </Accordion>

      <Accordion title="FileContentBlock" icon="file">
        **Purpose:** Generic files (PDF, etc)

        <ParamField body="type" type="string" required>
          Always `"file"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the file location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded file data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          File [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) (e.g., `application/pdf`)
        </ParamField>
      </Accordion>

      <Accordion title="PlainTextContentBlock" icon="align-left">
        **Purpose:** Document text (`.txt`, `.md`)

        <ParamField body="type" type="string" required>
          Always `"text-plain"`
        </ParamField>

        <ParamField body="text" type="string">
          The text content
        </ParamField>

        <ParamField body="mime_type" type="string">
          [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) of the text (e.g., `text/plain`, `text/markdown`)
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Tool Calling" icon="wrench">
    <AccordionGroup>
      <Accordion title="ToolCall" icon="function">
        **Purpose:** Function calls

        <ParamField body="type" type="string" required>
          Always `"tool_call"`
        </ParamField>

        <ParamField body="name" type="string" required>
          Name of the tool to call
        </ParamField>

        <ParamField body="args" type="object" required>
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="id" type="string" required>
          Unique identifier for this tool call
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "tool_call",
            "name": "search",
            "args": {"query": "weather"},
            "id": "call_123"
        }
        ```
      </Accordion>

      <Accordion title="ToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming tool call fragments

        <ParamField body="type" type="string" required>
          Always `"tool_call_chunk"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="id" type="string">
          Tool call identifier
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="InvalidToolCall" icon="triangle-exclamation">
        **Purpose:** Malformed calls, intended to catch JSON parsing errors.

        <ParamField body="type" type="string" required>
          Always `"invalid_tool_call"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool that failed to be called
        </ParamField>

        <ParamField body="args" type="object">
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="error" type="string">
          Description of what went wrong
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Server-Side Tool Execution" icon="server">
    <AccordionGroup>
      <Accordion title="ServerToolCall" icon="wrench">
        **Purpose:** Tool call that is executed server-side.

        <ParamField body="type" type="string" required>
          Always `"server_tool_call"`
        </ParamField>

        <ParamField body="id" type="string" required>
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string" required>
          The name of the tool to be called.
        </ParamField>

        <ParamField body="args" type="string" required>
          Partial tool arguments (may be incomplete JSON)
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming server-side tool call fragments

        <ParamField body="type" type="string" required>
          Always `"server_tool_call_chunk"`
        </ParamField>

        <ParamField body="id" type="string">
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolResult" icon="box-open">
        **Purpose:** Search results

        <ParamField body="type" type="string" required>
          Always `"server_tool_result"`
        </ParamField>

        <ParamField body="tool_call_id" type="string" required>
          Identifier of the corresponding server tool call.
        </ParamField>

        <ParamField body="id" type="string">
          Identifier associated with the server tool result.
        </ParamField>

        <ParamField body="status" type="string" required>
          Execution status of the server-side tool. `"success"` or `"error"`.
        </ParamField>

        <ParamField body="output">
          Output of the executed tool.
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Provider-Specific Blocks" icon="plug">
    <Accordion title="NonStandardContentBlock" icon="asterisk">
      **Purpose:** Provider-specific escape hatch

      <ParamField body="type" type="string" required>
        Always `"non_standard"`
      </ParamField>

      <ParamField body="value" type="object" required>
        Provider-specific data structure
      </ParamField>

      **Usage:** For experimental or provider-unique features
    </Accordion>

    Additional provider-specific content types may be found within the [reference documentation](/oss/python/integrations/providers/overview) of each model provider.
  </Accordion>
</AccordionGroup>

<Tip>
  View the canonical type definitions in the [API reference](https://reference.langchain.com/python/langchain/messages).
</Tip>

<Info>
  Content blocks were introduced as a new property on messages in LangChain v1 to standardize content formats across providers while maintaining backward compatibility with existing code. Content blocks are not a replacement for the [`content`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.messages.BaseMessage.content) property, but rather a new property that can be used to access the content of a message in a standardized format.
</Info>

## Use with chat models

[Chat models](/oss/python/langchain/models) accept a sequence of message objects as input and return an [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) as output. Interactions are often stateless, so that a simple conversational loop involves invoking a model with a growing list of messages.

Refer to the below guides to learn more:

* Built-in features for [persisting and managing conversation histories](/oss/python/langchain/short-term-memory)
* Strategies for managing context windows, including [trimming and summarizing messages](/oss/python/langchain/short-term-memory#common-patterns)

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/messages.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Messages

Messages are the fundamental unit of context for models in LangChain. They represent the input and output of models, carrying both the content and metadata needed to represent the state of a conversation when interacting with an LLM.

Messages are objects that contain:

* <Icon icon="user" size={16} /> [**Role**](#message-types) - Identifies the message type (e.g. `system`, `user`)
* <Icon icon="folder-closed" size={16} /> [**Content**](#message-content) - Represents the actual content of the message (like text, images, audio, documents, etc.)
* <Icon icon="tag" size={16} /> [**Metadata**](#message-metadata) - Optional fields such as response information, message IDs, and token usage

LangChain provides a standard message type that works across all model providers, ensuring consistent behavior regardless of the model being called.

## Basic usage

The simplest way to use messages is to create message objects and pass them to a model when [invoking](/oss/python/langchain/models#invocation).

```python  theme={null}
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, AIMessage, SystemMessage

model = init_chat_model("gpt-5-nano")

system_msg = SystemMessage("You are a helpful assistant.")
human_msg = HumanMessage("Hello, how are you?")

# Use with chat models
messages = [system_msg, human_msg]
response = model.invoke(messages)  # Returns AIMessage
```

### Text prompts

Text prompts are strings - ideal for straightforward generation tasks where you don't need to retain conversation history.

```python  theme={null}
response = model.invoke("Write a haiku about spring")
```

**Use text prompts when:**

* You have a single, standalone request
* You don't need conversation history
* You want minimal code complexity

### Message prompts

Alternatively, you can pass in a list of messages to the model by providing a list of message objects.

```python  theme={null}
from langchain.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage("You are a poetry expert"),
    HumanMessage("Write a haiku about spring"),
    AIMessage("Cherry blossoms bloom...")
]
response = model.invoke(messages)
```

**Use message prompts when:**

* Managing multi-turn conversations
* Working with multimodal content (images, audio, files)
* Including system instructions

### Dictionary format

You can also specify messages directly in OpenAI chat completions format.

```python  theme={null}
messages = [
    {"role": "system", "content": "You are a poetry expert"},
    {"role": "user", "content": "Write a haiku about spring"},
    {"role": "assistant", "content": "Cherry blossoms bloom..."}
]
response = model.invoke(messages)
```

## Message types

* <Icon icon="gear" size={16} /> [System message](#system-message) - Tells the model how to behave and provide context for interactions
* <Icon icon="user" size={16} /> [Human message](#human-message) - Represents user input and interactions with the model
* <Icon icon="robot" size={16} /> [AI message](#ai-message) - Responses generated by the model, including text content, tool calls, and metadata
* <Icon icon="wrench" size={16} /> [Tool message](#tool-message) - Represents the outputs of [tool calls](/oss/python/langchain/models#tool-calling)

### System Message

A [`SystemMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.SystemMessage) represent an initial set of instructions that primes the model's behavior. You can use a system message to set the tone, define the model's role, and establish guidelines for responses.

```python Basic instructions theme={null}
system_msg = SystemMessage("You are a helpful coding assistant.")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

```python Detailed persona theme={null}
from langchain.messages import SystemMessage, HumanMessage

system_msg = SystemMessage("""
You are a senior Python developer with expertise in web frameworks.
Always provide code examples and explain your reasoning.
Be concise but thorough in your explanations.
""")

messages = [
    system_msg,
    HumanMessage("How do I create a REST API?")
]
response = model.invoke(messages)
```

***

### Human Message

A [`HumanMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.HumanMessage) represents user input and interactions. They can contain text, images, audio, files, and any other amount of multimodal [content](#message-content).

#### Text content

<CodeGroup>
  ```python Message object theme={null}
  response = model.invoke([
    HumanMessage("What is machine learning?")
  ])
  ```

  ```python String shortcut theme={null}
  # Using a string is a shortcut for a single HumanMessage
  response = model.invoke("What is machine learning?")
  ```
</CodeGroup>

#### Message metadata

```python Add metadata theme={null}
human_msg = HumanMessage(
    content="Hello!",
    name="alice",  # Optional: identify different users
    id="msg_123",  # Optional: unique identifier for tracing
)
```

<Note>
  The `name` field behavior varies by provider - some use it for user identification, others ignore it. To check, refer to the model provider's [reference](https://reference.langchain.com/python/integrations/).
</Note>

***

### AI Message

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) represents the output of a model invocation. They can include multimodal data, tool calls, and provider-specific metadata that you can later access.

```python  theme={null}
response = model.invoke("Explain AI")
print(type(response))  # <class 'langchain_core.messages.ai.AIMessage'>
```

[`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) objects are returned by the model when calling it, which contains all of the associated metadata in the response.

Providers weigh/contextualize types of messages differently, which means it is sometimes helpful to manually create a new [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) object and insert it into the message history as if it came from the model.

```python  theme={null}
from langchain.messages import AIMessage, SystemMessage, HumanMessage

# Create an AI message manually (e.g., for conversation history)
ai_msg = AIMessage("I'd be happy to help you with that question!")

# Add to conversation history
messages = [
    SystemMessage("You are a helpful assistant"),
    HumanMessage("Can you help me?"),
    ai_msg,  # Insert as if it came from the model
    HumanMessage("Great! What's 2+2?")
]

response = model.invoke(messages)
```

<Accordion title="Attributes">
  <ParamField path="text" type="string">
    The text content of the message.
  </ParamField>

  <ParamField path="content" type="string | dict[]">
    The raw content of the message.
  </ParamField>

  <ParamField path="content_blocks" type="ContentBlock[]">
    The standardized [content blocks](#message-content) of the message.
  </ParamField>

  <ParamField path="tool_calls" type="dict[] | None">
    The tool calls made by the model. Empty if no tools are called.
  </ParamField>

  <ParamField path="id" type="string">
    A unique identifier for the message (either automatically generated by LangChain or returned in the provider response)
  </ParamField>

  <ParamField path="usage_metadata" type="dict | None">
    The usage metadata of the message, which can contain token counts when available.
  </ParamField>

  <ParamField path="response_metadata" type="ResponseMetadata | None">
    The response metadata of the message.
  </ParamField>
</Accordion>

#### Tool calls

When models make [tool calls](/oss/python/langchain/models#tool-calling), they're included in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage):

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

def get_weather(location: str) -> str:
    """Get the weather at a location."""
    ...

model_with_tools = model.bind_tools([get_weather])
response = model_with_tools.invoke("What's the weather in Paris?")

for tool_call in response.tool_calls:
    print(f"Tool: {tool_call['name']}")
    print(f"Args: {tool_call['args']}")
    print(f"ID: {tool_call['id']}")
```

Other structured data, such as reasoning or citations, can also appear in message [content](/oss/python/langchain/messages#message-content).

#### Token usage

An [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) can hold token counts and other usage metadata in its [`usage_metadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) field:

```python  theme={null}
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

response = model.invoke("Hello!")
response.usage_metadata
```

```
{'input_tokens': 8,
 'output_tokens': 304,
 'total_tokens': 312,
 'input_token_details': {'audio': 0, 'cache_read': 0},
 'output_token_details': {'audio': 0, 'reasoning': 256}}
```

See [`UsageMetadata`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.UsageMetadata) for details.

#### Streaming and chunks

During streaming, you'll receive [`AIMessageChunk`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessageChunk) objects that can be combined into a full message object:

```python  theme={null}
chunks = []
full_message = None
for chunk in model.stream("Hi"):
    chunks.append(chunk)
    print(chunk.text)
    full_message = chunk if full_message is None else full_message + chunk
```

<Note>
  Learn more:

  * [Streaming tokens from chat models](/oss/python/langchain/models#stream)
  * [Streaming tokens and/or steps from agents](/oss/python/langchain/streaming)
</Note>

***

### Tool Message

For models that support [tool calling](/oss/python/langchain/models#tool-calling), AI messages can contain tool calls. Tool messages are used to pass the results of a single tool execution back to the model.

[Tools](/oss/python/langchain/tools) can generate [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) objects directly. Below, we show a simple example. Read more in the [tools guide](/oss/python/langchain/tools).

```python  theme={null}
# After a model makes a tool call
ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "San Francisco"},
        "id": "call_123"
    }]
)

# Execute tool and create result message
weather_result = "Sunny, 72°F"
tool_message = ToolMessage(
    content=weather_result,
    tool_call_id="call_123"  # Must match the call ID
)

# Continue conversation
messages = [
    HumanMessage("What's the weather in San Francisco?"),
    ai_message,  # Model's tool call
    tool_message,  # Tool execution result
]
response = model.invoke(messages)  # Model processes the result
```

<Accordion title="Attributes">
  <ParamField path="content" type="string" required>
    The stringified output of the tool call.
  </ParamField>

  <ParamField path="tool_call_id" type="string" required>
    The ID of the tool call that this message is responding to. (this must match the ID of the tool call in the [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage))
  </ParamField>

  <ParamField path="name" type="string" required>
    The name of the tool that was called.
  </ParamField>

  <ParamField path="artifact" type="dict">
    Additional data not sent to the model but can be accessed programmatically.
  </ParamField>
</Accordion>

<Note>
  The `artifact` field stores supplementary data that won't be sent to the model but can be accessed programmatically. This is useful for storing raw results, debugging information, or data for downstream processing without cluttering the model's context.

  <Accordion title="Example: Using artifact for retrieval metadata">
    For example, a [retrieval](/oss/python/langchain/retrieval) tool could retrieve a passage from a document for reference by a model. Where message `content` contains text that the model will reference, an `artifact` can contain document identifiers or other metadata that an application can use (e.g., to render a page). See example below:

    ```python  theme={null}
    from langchain.messages import ToolMessage

    # Sent to model
    message_content = "It was the best of times, it was the worst of times."

    # Artifact available downstream
    artifact = {"document_id": "doc_123", "page": 0}

    tool_message = ToolMessage(
        content=message_content,
        tool_call_id="call_123",
        name="search_books",
        artifact=artifact,
    )
    ```

    See the [RAG tutorial](/oss/python/langchain/rag) for an end-to-end example of building retrieval [agents](/oss/python/langchain/agents) with LangChain.
  </Accordion>
</Note>

***

## Message content

You can think of a message's content as the payload of data that gets sent to the model. Messages have a `content` attribute that is loosely-typed, supporting strings and lists of untyped objects (e.g., dictionaries). This allows support for provider-native structures directly in LangChain chat models, such as [multimodal](#multimodal) content and other data.

Separately, LangChain provides dedicated content types for text, reasoning, citations, multi-modal data, server-side tool calls, and other message content. See [content blocks](#standard-content-blocks) below.

LangChain chat models accept message content in the `content` attribute, and can contain:

1. A string
2. A list of content blocks in a provider-native format
3. A list of [LangChain's standard content blocks](#standard-content-blocks)

See below for an example using [multimodal](#multimodal) inputs:

```python  theme={null}
from langchain.messages import HumanMessage

# String content
human_message = HumanMessage("Hello, how are you?")

# Provider-native format (e.g., OpenAI)
human_message = HumanMessage(content=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
])

# List of standard content blocks
human_message = HumanMessage(content_blocks=[
    {"type": "text", "text": "Hello, how are you?"},
    {"type": "image", "url": "https://example.com/image.jpg"},
])
```

<Tip>
  Specifying `content_blocks` when initializing a message will still populate message
  `content`, but provides a type-safe interface for doing so.
</Tip>

### Standard content blocks

LangChain provides a standard representation for message content that works across providers.

Message objects implement a `content_blocks` property that will lazily parse the `content` attribute into a standard, type-safe representation. For example, messages generated from [ChatAnthropic](/oss/python/integrations/chat/anthropic) or [ChatOpenAI](/oss/python/integrations/chat/openai) will include `thinking` or `reasoning` blocks in the format of the respective provider, but can be lazily parsed into a consistent [`ReasoningContentBlock`](#content-block-reference) representation:

<Tabs>
  <Tab title="Anthropic">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {"type": "thinking", "thinking": "...", "signature": "WaUjzkyp..."},
            {"type": "text", "text": "..."},
        ],
        response_metadata={"model_provider": "anthropic"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning',
      'reasoning': '...',
      'extras': {'signature': 'WaUjzkyp...'}},
     {'type': 'text', 'text': '...'}]
    ```
  </Tab>

  <Tab title="OpenAI">
    ```python  theme={null}
    from langchain.messages import AIMessage

    message = AIMessage(
        content=[
            {
                "type": "reasoning",
                "id": "rs_abc123",
                "summary": [
                    {"type": "summary_text", "text": "summary 1"},
                    {"type": "summary_text", "text": "summary 2"},
                ],
            },
            {"type": "text", "text": "...", "id": "msg_abc123"},
        ],
        response_metadata={"model_provider": "openai"}
    )
    message.content_blocks
    ```

    ```
    [{'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 1'},
     {'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 2'},
     {'type': 'text', 'text': '...', 'id': 'msg_abc123'}]
    ```
  </Tab>
</Tabs>

See the [integrations guides](/oss/python/integrations/providers/overview) to get started with the
inference provider of your choice.

<Note>
  **Serializing standard content**

  If an application outside of LangChain needs access to the standard content block
  representation, you can opt-in to storing content blocks in message content.

  To do this, you can set the `LC_OUTPUT_VERSION` environment variable to `v1`. Or,
  initialize any chat model with `output_version="v1"`:

  ```python  theme={null}
  from langchain.chat_models import init_chat_model

  model = init_chat_model("gpt-5-nano", output_version="v1")
  ```
</Note>

### Multimodal

**Multimodality** refers to the ability to work with data that comes in different
forms, such as text, audio, images, and video. LangChain includes standard types
for these data that can be used across providers.

[Chat models](/oss/python/langchain/models) can accept multimodal data as input and generate
it as output. Below we show short examples of input messages featuring multimodal data.

<Note>
  Extra keys can be included top-level in the content block or nested in `"extras": {"key": value}`.

  [OpenAI](/oss/python/integrations/chat/openai#pdfs) and [AWS Bedrock Converse](/oss/python/integrations/chat/bedrock),
  for example, require a filename for PDFs. See the [provider page](/oss/python/integrations/providers/overview)
  for your chosen model for specifics.
</Note>

<CodeGroup>
  ```python Image input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "url": "https://example.com/path/to/image.jpg"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {
              "type": "image",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "image/jpeg",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this image."},
          {"type": "image", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python PDF document input theme={null}
  # From URL
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "url": "https://example.com/path/to/document.pdf"},
      ]
  }

  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {
              "type": "file",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "application/pdf",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this document."},
          {"type": "file", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Audio input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {
              "type": "audio",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "audio/wav",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this audio."},
          {"type": "audio", "file_id": "file-abc123"},
      ]
  }
  ```

  ```python Video input theme={null}
  # From base64 data
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {
              "type": "video",
              "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
              "mime_type": "video/mp4",
          },
      ]
  }

  # From provider-managed File ID
  message = {
      "role": "user",
      "content": [
          {"type": "text", "text": "Describe the content of this video."},
          {"type": "video", "file_id": "file-abc123"},
      ]
  }
  ```
</CodeGroup>

<Warning>
  Not all models support all file types. Check the model provider's [reference](https://reference.langchain.com/python/integrations/) for supported formats and size limits.
</Warning>

### Content block reference

Content blocks are represented (either when creating a message or accessing the `content_blocks` property) as a list of typed dictionaries. Each item in the list must adhere to one of the following block types:

<AccordionGroup>
  <Accordion title="Core" icon="cube">
    <AccordionGroup>
      <Accordion title="TextContentBlock" icon="text">
        **Purpose:** Standard text output

        <ParamField body="type" type="string" required>
          Always `"text"`
        </ParamField>

        <ParamField body="text" type="string" required>
          The text content
        </ParamField>

        <ParamField body="annotations" type="object[]">
          List of annotations for the text
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "text",
            "text": "Hello world",
            "annotations": []
        }
        ```
      </Accordion>

      <Accordion title="ReasoningContentBlock" icon="brain">
        **Purpose:** Model reasoning steps

        <ParamField body="type" type="string" required>
          Always `"reasoning"`
        </ParamField>

        <ParamField body="reasoning" type="string">
          The reasoning content
        </ParamField>

        <ParamField body="extras" type="object">
          Additional provider-specific data
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "reasoning",
            "reasoning": "The user is asking about...",
            "extras": {"signature": "abc123"},
        }
        ```
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Multimodal" icon="images">
    <AccordionGroup>
      <Accordion title="ImageContentBlock" icon="image">
        **Purpose:** Image data

        <ParamField body="type" type="string" required>
          Always `"image"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the image location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded image data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored image (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Image [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#image) (e.g., `image/jpeg`, `image/png`)
        </ParamField>
      </Accordion>

      <Accordion title="AudioContentBlock" icon="volume-high">
        **Purpose:** Audio data

        <ParamField body="type" type="string" required>
          Always `"audio"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the audio location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded audio data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored audio file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Audio [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#audio) (e.g., `audio/mpeg`, `audio/wav`)
        </ParamField>
      </Accordion>

      <Accordion title="VideoContentBlock" icon="video">
        **Purpose:** Video data

        <ParamField body="type" type="string" required>
          Always `"video"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the video location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded video data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored video file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          Video [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml#video) (e.g., `video/mp4`, `video/webm`)
        </ParamField>
      </Accordion>

      <Accordion title="FileContentBlock" icon="file">
        **Purpose:** Generic files (PDF, etc)

        <ParamField body="type" type="string" required>
          Always `"file"`
        </ParamField>

        <ParamField body="url" type="string">
          URL pointing to the file location.
        </ParamField>

        <ParamField body="base64" type="string">
          Base64-encoded file data.
        </ParamField>

        <ParamField body="id" type="string">
          Reference ID to an externally stored file (e.g., in a provider's file system or in a bucket).
        </ParamField>

        <ParamField body="mime_type" type="string">
          File [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) (e.g., `application/pdf`)
        </ParamField>
      </Accordion>

      <Accordion title="PlainTextContentBlock" icon="align-left">
        **Purpose:** Document text (`.txt`, `.md`)

        <ParamField body="type" type="string" required>
          Always `"text-plain"`
        </ParamField>

        <ParamField body="text" type="string">
          The text content
        </ParamField>

        <ParamField body="mime_type" type="string">
          [MIME type](https://www.iana.org/assignments/media-types/media-types.xhtml) of the text (e.g., `text/plain`, `text/markdown`)
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Tool Calling" icon="wrench">
    <AccordionGroup>
      <Accordion title="ToolCall" icon="function">
        **Purpose:** Function calls

        <ParamField body="type" type="string" required>
          Always `"tool_call"`
        </ParamField>

        <ParamField body="name" type="string" required>
          Name of the tool to call
        </ParamField>

        <ParamField body="args" type="object" required>
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="id" type="string" required>
          Unique identifier for this tool call
        </ParamField>

        **Example:**

        ```python  theme={null}
        {
            "type": "tool_call",
            "name": "search",
            "args": {"query": "weather"},
            "id": "call_123"
        }
        ```
      </Accordion>

      <Accordion title="ToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming tool call fragments

        <ParamField body="type" type="string" required>
          Always `"tool_call_chunk"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="id" type="string">
          Tool call identifier
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="InvalidToolCall" icon="triangle-exclamation">
        **Purpose:** Malformed calls, intended to catch JSON parsing errors.

        <ParamField body="type" type="string" required>
          Always `"invalid_tool_call"`
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool that failed to be called
        </ParamField>

        <ParamField body="args" type="object">
          Arguments to pass to the tool
        </ParamField>

        <ParamField body="error" type="string">
          Description of what went wrong
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Server-Side Tool Execution" icon="server">
    <AccordionGroup>
      <Accordion title="ServerToolCall" icon="wrench">
        **Purpose:** Tool call that is executed server-side.

        <ParamField body="type" type="string" required>
          Always `"server_tool_call"`
        </ParamField>

        <ParamField body="id" type="string" required>
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string" required>
          The name of the tool to be called.
        </ParamField>

        <ParamField body="args" type="string" required>
          Partial tool arguments (may be incomplete JSON)
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolCallChunk" icon="puzzle-piece">
        **Purpose:** Streaming server-side tool call fragments

        <ParamField body="type" type="string" required>
          Always `"server_tool_call_chunk"`
        </ParamField>

        <ParamField body="id" type="string">
          An identifier associated with the tool call.
        </ParamField>

        <ParamField body="name" type="string">
          Name of the tool being called
        </ParamField>

        <ParamField body="args" type="string">
          Partial tool arguments (may be incomplete JSON)
        </ParamField>

        <ParamField body="index" type="number | string">
          Position of this chunk in the stream
        </ParamField>
      </Accordion>

      <Accordion title="ServerToolResult" icon="box-open">
        **Purpose:** Search results

        <ParamField body="type" type="string" required>
          Always `"server_tool_result"`
        </ParamField>

        <ParamField body="tool_call_id" type="string" required>
          Identifier of the corresponding server tool call.
        </ParamField>

        <ParamField body="id" type="string">
          Identifier associated with the server tool result.
        </ParamField>

        <ParamField body="status" type="string" required>
          Execution status of the server-side tool. `"success"` or `"error"`.
        </ParamField>

        <ParamField body="output">
          Output of the executed tool.
        </ParamField>
      </Accordion>
    </AccordionGroup>
  </Accordion>

  <Accordion title="Provider-Specific Blocks" icon="plug">
    <Accordion title="NonStandardContentBlock" icon="asterisk">
      **Purpose:** Provider-specific escape hatch

      <ParamField body="type" type="string" required>
        Always `"non_standard"`
      </ParamField>

      <ParamField body="value" type="object" required>
        Provider-specific data structure
      </ParamField>

      **Usage:** For experimental or provider-unique features
    </Accordion>

    Additional provider-specific content types may be found within the [reference documentation](/oss/python/integrations/providers/overview) of each model provider.
  </Accordion>
</AccordionGroup>

<Tip>
  View the canonical type definitions in the [API reference](https://reference.langchain.com/python/langchain/messages).
</Tip>

<Info>
  Content blocks were introduced as a new property on messages in LangChain v1 to standardize content formats across providers while maintaining backward compatibility with existing code. Content blocks are not a replacement for the [`content`](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.messages.BaseMessage.content) property, but rather a new property that can be used to access the content of a message in a standardized format.
</Info>

## Use with chat models

[Chat models](/oss/python/langchain/models) accept a sequence of message objects as input and return an [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) as output. Interactions are often stateless, so that a simple conversational loop involves invoking a model with a growing list of messages.

Refer to the below guides to learn more:

* Built-in features for [persisting and managing conversation histories](/oss/python/langchain/short-term-memory)
* Strategies for managing context windows, including [trimming and summarizing messages](/oss/python/langchain/short-term-memory#common-patterns)

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/messages.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Streaming

LangChain implements a streaming system to surface real-time updates.

Streaming is crucial for enhancing the responsiveness of applications built on LLMs. By displaying output progressively, even before a complete response is ready, streaming significantly improves user experience (UX), particularly when dealing with the latency of LLMs.

## Overview

LangChain's streaming system lets you surface live feedback from agent runs to your application.

What's possible with LangChain streaming:

* <Icon icon="brain" size={16} /> [**Stream agent progress**](#agent-progress) — get state updates after each agent step.
* <Icon icon="square-binary" size={16} /> [**Stream LLM tokens**](#llm-tokens) — stream language model tokens as they're generated.
* <Icon icon="table" size={16} /> [**Stream custom updates**](#custom-updates) — emit user-defined signals (e.g., `"Fetched 10/100 records"`).
* <Icon icon="layer-plus" size={16} /> [**Stream multiple modes**](#stream-multiple-modes) — choose from `updates` (agent progress), `messages` (LLM tokens + metadata), or `custom` (arbitrary user data).

## Agent progress

To stream agent progress, use the [`stream`](https://reference.langchain.com/python/langgraph/graphs/#langgraph.graph.state.CompiledStateGraph.stream) or [`astream`](https://reference.langchain.com/python/langgraph/graphs/#langgraph.graph.state.CompiledStateGraph.astream) methods with `stream_mode="updates"`. This emits an event after every agent step.

For example, if you have an agent that calls a tool once, you should see the following updates:

* **LLM node**: [`AIMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.AIMessage) with tool call requests
* **Tool node**: [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) with execution result
* **LLM node**: Final AI response

```python title="Streaming agent progress" theme={null}
from langchain.agents import create_agent


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)
for chunk in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="updates",
):
    for step, data in chunk.items():
        print(f"step: {step}")
        print(f"content: {data['messages'][-1].content_blocks}")
```

```shell title="Output" theme={null}
step: model
content: [{'type': 'tool_call', 'name': 'get_weather', 'args': {'city': 'San Francisco'}, 'id': 'call_OW2NYNsNSKhRZpjW0wm2Aszd'}]

step: tools
content: [{'type': 'text', 'text': "It's always sunny in San Francisco!"}]

step: model
content: [{'type': 'text', 'text': 'It's always sunny in San Francisco!'}]
```

## LLM tokens

To stream tokens as they are produced by the LLM, use `stream_mode="messages"`. Below you can see the output of the agent streaming tool calls and the final response.

```python title="Streaming LLM tokens" theme={null}
from langchain.agents import create_agent


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)
for token, metadata in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="messages",
):
    print(f"node: {metadata['langgraph_node']}")
    print(f"content: {token.content_blocks}")
    print("\n")
```

```shell title="Output" expandable theme={null}
node: model
content: [{'type': 'tool_call_chunk', 'id': 'call_vbCyBcP8VuneUzyYlSBZZsVa', 'name': 'get_weather', 'args': '', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '{"', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': 'city', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '":"', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': 'San', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': ' Francisco', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '"}', 'index': 0}]


node: model
content: []


node: tools
content: [{'type': 'text', 'text': "It's always sunny in San Francisco!"}]


node: model
content: []


node: model
content: [{'type': 'text', 'text': 'Here'}]


node: model
content: [{'type': 'text', 'text': ''s'}]


node: model
content: [{'type': 'text', 'text': ' what'}]


node: model
content: [{'type': 'text', 'text': ' I'}]


node: model
content: [{'type': 'text', 'text': ' got'}]


node: model
content: [{'type': 'text', 'text': ':'}]


node: model
content: [{'type': 'text', 'text': ' "'}]


node: model
content: [{'type': 'text', 'text': "It's"}]


node: model
content: [{'type': 'text', 'text': ' always'}]


node: model
content: [{'type': 'text', 'text': ' sunny'}]


node: model
content: [{'type': 'text', 'text': ' in'}]


node: model
content: [{'type': 'text', 'text': ' San'}]


node: model
content: [{'type': 'text', 'text': ' Francisco'}]


node: model
content: [{'type': 'text', 'text': '!"\n\n'}]
```

## Custom updates

To stream updates from tools as they are executed, you can use [`get_stream_writer`](https://reference.langchain.com/python/langgraph/config/#langgraph.config.get_stream_writer).

```python title="Streaming custom updates" theme={null}
from langchain.agents import create_agent
from langgraph.config import get_stream_writer  # [!code highlight]


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    writer = get_stream_writer()  # [!code highlight]
    # stream any arbitrary data
    writer(f"Looking up data for city: {city}")
    writer(f"Acquired data for city: {city}")
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="claude-sonnet-4-5-20250929",
    tools=[get_weather],
)

for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="custom"  # [!code highlight]
):
    print(chunk)
```

```shell title="Output" theme={null}
Looking up data for city: San Francisco
Acquired data for city: San Francisco
```

<Note>
  If you add [`get_stream_writer`](https://reference.langchain.com/python/langgraph/config/#langgraph.config.get_stream_writer) inside your tool, you won't be able to invoke the tool outside of a LangGraph execution context.
</Note>

## Stream multiple modes

You can specify multiple streaming modes by passing stream mode as a list: `stream_mode=["updates", "custom"]`:

```python title="Streaming multiple modes" theme={null}
from langchain.agents import create_agent
from langgraph.config import get_stream_writer


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    writer = get_stream_writer()
    writer(f"Looking up data for city: {city}")
    writer(f"Acquired data for city: {city}")
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)

for stream_mode, chunk in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode=["updates", "custom"]
):
    print(f"stream_mode: {stream_mode}")
    print(f"content: {chunk}")
    print("\n")
```

```shell title="Output" theme={null}
stream_mode: updates
content: {'model': {'messages': [AIMessage(content='', response_metadata={'token_usage': {'completion_tokens': 280, 'prompt_tokens': 132, 'total_tokens': 412, 'completion_tokens_details': {'accepted_prediction_tokens': 0, 'audio_tokens': 0, 'reasoning_tokens': 256, 'rejected_prediction_tokens': 0}, 'prompt_tokens_details': {'audio_tokens': 0, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'gpt-5-nano-2025-08-07', 'system_fingerprint': None, 'id': 'chatcmpl-C9tlgBzGEbedGYxZ0rTCz5F7OXpL7', 'service_tier': 'default', 'finish_reason': 'tool_calls', 'logprobs': None}, id='lc_run--480c07cb-e405-4411-aa7f-0520fddeed66-0', tool_calls=[{'name': 'get_weather', 'args': {'city': 'San Francisco'}, 'id': 'call_KTNQIftMrl9vgNwEfAJMVu7r', 'type': 'tool_call'}], usage_metadata={'input_tokens': 132, 'output_tokens': 280, 'total_tokens': 412, 'input_token_details': {'audio': 0, 'cache_read': 0}, 'output_token_details': {'audio': 0, 'reasoning': 256}})]}}


stream_mode: custom
content: Looking up data for city: San Francisco


stream_mode: custom
content: Acquired data for city: San Francisco


stream_mode: updates
content: {'tools': {'messages': [ToolMessage(content="It's always sunny in San Francisco!", name='get_weather', tool_call_id='call_KTNQIftMrl9vgNwEfAJMVu7r')]}}


stream_mode: updates
content: {'model': {'messages': [AIMessage(content='San Francisco weather: It's always sunny in San Francisco!\n\n', response_metadata={'token_usage': {'completion_tokens': 764, 'prompt_tokens': 168, 'total_tokens': 932, 'completion_tokens_details': {'accepted_prediction_tokens': 0, 'audio_tokens': 0, 'reasoning_tokens': 704, 'rejected_prediction_tokens': 0}, 'prompt_tokens_details': {'audio_tokens': 0, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'gpt-5-nano-2025-08-07', 'system_fingerprint': None, 'id': 'chatcmpl-C9tljDFVki1e1haCyikBptAuXuHYG', 'service_tier': 'default', 'finish_reason': 'stop', 'logprobs': None}, id='lc_run--acbc740a-18fe-4a14-8619-da92a0d0ee90-0', usage_metadata={'input_tokens': 168, 'output_tokens': 764, 'total_tokens': 932, 'input_token_details': {'audio': 0, 'cache_read': 0}, 'output_token_details': {'audio': 0, 'reasoning': 704}})]}}
```

## Disable streaming

In some applications you might need to disable streaming of individual tokens for a given model.

This is useful in [multi-agent](/oss/python/langchain/multi-agent) systems to control which agents stream their output.

See the [Models](/oss/python/langchain/models#disable-streaming) guide to learn how to disable streaming.

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/streaming.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Middleware

> Control and customize agent execution at every step

Middleware provides a way to more tightly control what happens inside the agent.

The core agent loop involves calling a model, letting it choose tools to execute, and then finishing when it calls no more tools:

<div style={{ display: "flex", justifyContent: "center" }}>
  <img src="https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=ac72e48317a9ced68fd1be64e89ec063" alt="Core agent loop diagram" className="rounded-lg" data-og-width="300" width="300" data-og-height="268" height="268" data-path="oss/images/core_agent_loop.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=280&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=a4c4b766b6678ef52a6ed556b1a0b032 280w, https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=560&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=111869e6e99a52c0eff60a1ef7ddc49c 560w, https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=840&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=6c1e21de7b53bd0a29683aca09c6f86e 840w, https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=1100&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=88bef556edba9869b759551c610c60f4 1100w, https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=1650&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=9b0bdd138e9548eeb5056dc0ed2d4a4b 1650w, https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?w=2500&fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=41eb4f053ed5e6b0ba5bad2badf6d755 2500w" />
</div>

Middleware exposes hooks before and after each of those steps:

<div style={{ display: "flex", justifyContent: "center" }}>
  <img src="https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=eb4404b137edec6f6f0c8ccb8323eaf1" alt="Middleware flow diagram" className="rounded-lg" data-og-width="500" width="500" data-og-height="560" height="560" data-path="oss/images/middleware_final.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=280&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=483413aa87cf93323b0f47c0dd5528e8 280w, https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=560&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=41b7dd647447978ff776edafe5f42499 560w, https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=840&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=e9b14e264f68345de08ae76f032c52d4 840w, https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=1100&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=ec45e1932d1279b1beee4a4b016b473f 1100w, https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=1650&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=3bca5ebf8aa56632b8a9826f7f112e57 1650w, https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?w=2500&fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=437f141d1266f08a95f030c2804691d9 2500w" />
</div>

## What can middleware do?

<CardGroup cols={2}>
  <Card title="Monitor" icon="chart-line">
    Track agent behavior with logging, analytics, and debugging
  </Card>

  <Card title="Modify" icon="pencil">
    Transform prompts, tool selection, and output formatting
  </Card>

  <Card title="Control" icon="sliders">
    Add retries, fallbacks, and early termination logic
  </Card>

  <Card title="Enforce" icon="shield">
    Apply rate limits, guardrails, and PII detection
  </Card>
</CardGroup>

Add middleware by passing it to [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent):

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware, HumanInTheLoopMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[...],
    middleware=[SummarizationMiddleware(), HumanInTheLoopMiddleware()],
)
```

## Built-in middleware

LangChain provides prebuilt middleware for common use cases:

### Summarization

Automatically summarize conversation history when approaching token limits.

<Tip>
  **Perfect for:**

  * Long-running conversations that exceed context windows
  * Multi-turn dialogues with extensive history
  * Applications where preserving full conversation context matters
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[weather_tool, calculator_tool],
    middleware=[
        SummarizationMiddleware(
            model="gpt-4o-mini",
            max_tokens_before_summary=4000,  # Trigger summarization at 4000 tokens
            messages_to_keep=20,  # Keep last 20 messages after summary
            summary_prompt="Custom prompt for summarization...",  # Optional
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="model" type="string" required>
    Model for generating summaries
  </ParamField>

  <ParamField body="max_tokens_before_summary" type="number">
    Token threshold for triggering summarization
  </ParamField>

  <ParamField body="messages_to_keep" type="number" default="20">
    Recent messages to preserve
  </ParamField>

  <ParamField body="token_counter" type="function">
    Custom token counting function. Defaults to character-based counting.
  </ParamField>

  <ParamField body="summary_prompt" type="string">
    Custom prompt template. Uses built-in template if not specified.
  </ParamField>

  <ParamField body="summary_prefix" type="string" default="## Previous conversation summary:">
    Prefix for summary messages
  </ParamField>
</Accordion>

### Human-in-the-loop

Pause agent execution for human approval, editing, or rejection of tool calls before they execute.

<Tip>
  **Perfect for:**

  * High-stakes operations requiring human approval (database writes, financial transactions)
  * Compliance workflows where human oversight is mandatory
  * Long running conversations where human feedback is used to guide the agent
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver


agent = create_agent(
    model="gpt-4o",
    tools=[read_email_tool, send_email_tool],
    checkpointer=InMemorySaver(),
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                # Require approval, editing, or rejection for sending emails
                "send_email_tool": {
                    "allowed_decisions": ["approve", "edit", "reject"],
                },
                # Auto-approve reading emails
                "read_email_tool": False,
            }
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="interrupt_on" type="dict" required>
    Mapping of tool names to approval configs. Values can be `True` (interrupt with default config), `False` (auto-approve), or an `InterruptOnConfig` object.
  </ParamField>

  <ParamField body="description_prefix" type="string" default="Tool execution requires approval">
    Prefix for action request descriptions
  </ParamField>

  **`InterruptOnConfig` options:**

  <ParamField body="allowed_decisions" type="list[string]">
    List of allowed decisions: `"approve"`, `"edit"`, or `"reject"`
  </ParamField>

  <ParamField body="description" type="string | callable">
    Static string or callable function for custom description
  </ParamField>
</Accordion>

<Note>
  **Important:** Human-in-the-loop middleware requires a [checkpointer](/oss/python/langgraph/persistence#checkpoints) to maintain state across interruptions.

  See the [human-in-the-loop documentation](/oss/python/langchain/human-in-the-loop) for complete examples and integration patterns.
</Note>

### Anthropic prompt caching

Reduce costs by caching repetitive prompt prefixes with Anthropic models.

<Tip>
  **Perfect for:**

  * Applications with long, repeated system prompts
  * Agents that reuse the same context across invocations
  * Reducing API costs for high-volume deployments
</Tip>

<Info>
  Learn more about [Anthropic Prompt Caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching#cache-limitations) strategies and limitations.
</Info>

```python  theme={null}
from langchain_anthropic import ChatAnthropic
from langchain_anthropic.middleware import AnthropicPromptCachingMiddleware
from langchain.agents import create_agent


LONG_PROMPT = """
Please be a helpful assistant.

<Lots more context ...>
"""

agent = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-5-20250929"),
    system_prompt=LONG_PROMPT,
    middleware=[AnthropicPromptCachingMiddleware(ttl="5m")],
)

# cache store
agent.invoke({"messages": [HumanMessage("Hi, my name is Bob")]})

# cache hit, system prompt is cached
agent.invoke({"messages": [HumanMessage("What's my name?")]})
```

<Accordion title="Configuration options">
  <ParamField body="type" type="string" default="ephemeral">
    Cache type. Only `"ephemeral"` is currently supported.
  </ParamField>

  <ParamField body="ttl" type="string" default="5m">
    Time to live for cached content. Valid values: `"5m"` or `"1h"`
  </ParamField>

  <ParamField body="min_messages_to_cache" type="number" default="0">
    Minimum number of messages before caching starts
  </ParamField>

  <ParamField body="unsupported_model_behavior" type="string" default="warn">
    Behavior when using non-Anthropic models. Options: `"ignore"`, `"warn"`, or `"raise"`
  </ParamField>
</Accordion>

### Model call limit

Limit the number of model calls to prevent infinite loops or excessive costs.

<Tip>
  **Perfect for:**

  * Preventing runaway agents from making too many API calls
  * Enforcing cost controls on production deployments
  * Testing agent behavior within specific call budgets
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import ModelCallLimitMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[...],
    middleware=[
        ModelCallLimitMiddleware(
            thread_limit=10,  # Max 10 calls per thread (across runs)
            run_limit=5,  # Max 5 calls per run (single invocation)
            exit_behavior="end",  # Or "error" to raise exception
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="thread_limit" type="number">
    Maximum model calls across all runs in a thread. Defaults to no limit.
  </ParamField>

  <ParamField body="run_limit" type="number">
    Maximum model calls per single invocation. Defaults to no limit.
  </ParamField>

  <ParamField body="exit_behavior" type="string" default="end">
    Behavior when limit is reached. Options: `"end"` (graceful termination) or `"error"` (raise exception)
  </ParamField>
</Accordion>

### Tool call limit

Control agent execution by limiting the number of tool calls, either globally across all tools or for specific tools.

<Tip>
  **Perfect for:**

  * Preventing excessive calls to expensive external APIs
  * Limiting web searches or database queries
  * Enforcing rate limits on specific tool usage
  * Protecting against runaway agent loops
</Tip>

To limit tool calls globally across all tools or for specific tools, set `tool_name`. For each limit, specify one or both of:

* **Thread limit** (`thread_limit`) - Max calls across all runs in a conversation. Persists across invocations. Requires a checkpointer.
* **Run limit** (`run_limit`) - Max calls per single invocation. Resets each turn.

**Exit behaviors:**

| Behavior                   | Effect                                                     | Best For                                                            |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| **`"continue"`** (default) | Blocks exceeded calls with error messages, agent continues | Most use cases - agent handles limits gracefully                    |
| **`"error"`**              | Raises exception immediately                               | Complex workflows where you want to handle the limit error manually |
| **`"end"`**                | Stops with ToolMessage + AI message                        | Single-tool scenarios (errors if other tools pending)               |

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import ToolCallLimitMiddleware

# Global limit: max 20 calls per thread, 10 per run
global_limiter = ToolCallLimitMiddleware(
    thread_limit=20,
    run_limit=10,
)

# Tool-specific limit with default "continue" behavior
search_limiter = ToolCallLimitMiddleware(
    tool_name="search",
    thread_limit=5,
    run_limit=3,
)

# Thread limit only (no per-run limit)
database_limiter = ToolCallLimitMiddleware(
    tool_name="query_database",
    thread_limit=10,
)

# Strict enforcement with "error" behavior
web_scraper_limiter = ToolCallLimitMiddleware(
    tool_name="scrape_webpage",
    run_limit=2,
    exit_behavior="error",
)

# Immediate termination with "end" behavior
critical_tool_limiter = ToolCallLimitMiddleware(
    tool_name="delete_records",
    run_limit=1,
    exit_behavior="end",
)

# Use multiple limiters together
agent = create_agent(
    model="gpt-4o",
    tools=[search_tool, database_tool, scraper_tool],
    middleware=[
        global_limiter,
        search_limiter,
        database_limiter,
        web_scraper_limiter
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="tool_name" type="string">
    Name of specific tool to limit. If not provided, limits apply to **all tools globally**.
  </ParamField>

  <ParamField body="thread_limit" type="number">
    Maximum tool calls across all runs in a thread (conversation). Persists across multiple invocations with the same thread ID. Requires a checkpointer to maintain state. `None` means no thread limit.
  </ParamField>

  <ParamField body="run_limit" type="number">
    Maximum tool calls per single invocation (one user message → response cycle). Resets with each new user message. `None` means no run limit.

    **Note:** At least one of `thread_limit` or `run_limit` must be specified.
  </ParamField>

  <ParamField body="exit_behavior" type="string" default="continue">
    Behavior when limit is reached:

    * `"continue"` (default) - Block exceeded tool calls with error messages, let other tools and the model continue. The model decides when to end based on the error messages.
    * `"error"` - Raise a `ToolCallLimitExceededError` exception, stopping execution immediately
    * `"end"` - Stop execution immediately with a ToolMessage and AI message for the exceeded tool call. Only works when limiting a single tool; raises `NotImplementedError` if other tools have pending calls.
  </ParamField>
</Accordion>

### Model fallback

Automatically fallback to alternative models when the primary model fails.

<Tip>
  **Perfect for:**

  * Building resilient agents that handle model outages
  * Cost optimization by falling back to cheaper models
  * Provider redundancy across OpenAI, Anthropic, etc.
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import ModelFallbackMiddleware


agent = create_agent(
    model="gpt-4o",  # Primary model
    tools=[...],
    middleware=[
        ModelFallbackMiddleware(
            "gpt-4o-mini",  # Try first on error
            "claude-3-5-sonnet-20241022",  # Then this
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="first_model" type="string | BaseChatModel" required>
    First fallback model to try when the primary model fails. Can be a model string (e.g., `"openai:gpt-4o-mini"`) or a `BaseChatModel` instance.
  </ParamField>

  <ParamField body="*additional_models" type="string | BaseChatModel">
    Additional fallback models to try in order if previous models fail
  </ParamField>
</Accordion>

### PII detection

Detect and handle Personally Identifiable Information in conversations.

<Tip>
  **Perfect for:**

  * Healthcare and financial applications with compliance requirements
  * Customer service agents that need to sanitize logs
  * Any application handling sensitive user data
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[...],
    middleware=[
        # Redact emails in user input
        PIIMiddleware("email", strategy="redact", apply_to_input=True),
        # Mask credit cards (show last 4 digits)
        PIIMiddleware("credit_card", strategy="mask", apply_to_input=True),
        # Custom PII type with regex
        PIIMiddleware(
            "api_key",
            detector=r"sk-[a-zA-Z0-9]{32}",
            strategy="block",  # Raise error if detected
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="pii_type" type="string" required>
    Type of PII to detect. Can be a built-in type (`email`, `credit_card`, `ip`, `mac_address`, `url`) or a custom type name.
  </ParamField>

  <ParamField body="strategy" type="string" default="redact">
    How to handle detected PII. Options:

    * `"block"` - Raise exception when detected
    * `"redact"` - Replace with `[REDACTED_TYPE]`
    * `"mask"` - Partially mask (e.g., `****-****-****-1234`)
    * `"hash"` - Replace with deterministic hash
  </ParamField>

  <ParamField body="detector" type="function | regex">
    Custom detector function or regex pattern. If not provided, uses built-in detector for the PII type.
  </ParamField>

  <ParamField body="apply_to_input" type="boolean" default="True">
    Check user messages before model call
  </ParamField>

  <ParamField body="apply_to_output" type="boolean" default="False">
    Check AI messages after model call
  </ParamField>

  <ParamField body="apply_to_tool_results" type="boolean" default="False">
    Check tool result messages after execution
  </ParamField>
</Accordion>

### To-do list

Equip agents with task planning and tracking capabilities for complex multi-step tasks.

<Tip>
  **Perfect for:**

  * Complex multi-step tasks requiring coordination across multiple tools
  * Long-running operations where progress visibility is important
</Tip>

Just as humans are more effective when they write down and track tasks, agents benefit from structured task management to break down complex problems, adapt plans as new information emerges, and provide transparency into their workflow.

You may have noticed patterns like this in Claude Code, which writes out a to-do list before tackling complex, multi-part tasks.

<Note>
  This middleware automatically provides agents with a `write_todos` tool and system prompts to guide effective task planning.
</Note>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import TodoListMiddleware
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool


@tool
def read_file(file_path: str) -> str:
    """Read contents of a file."""
    with open(file_path) as f:
        return f.read()


@tool
def write_file(file_path: str, content: str) -> str:
    """Write content to a file."""
    with open(file_path, 'w') as f:
        f.write(content)
    return f"Wrote {len(content)} characters to {file_path}"


@tool
def run_tests(test_path: str) -> str:
    """Run tests and return results."""
    # Simplified for example
    return "All tests passed!"


agent = create_agent(
    model="gpt-4o",
    tools=[read_file, write_file, run_tests],
    middleware=[TodoListMiddleware()],
)

result = agent.invoke({
    "messages": [HumanMessage("Refactor the authentication module to use async/await and ensure all tests pass")]
})

# The agent will use write_todos to plan and track:
# 1. Read current authentication module code
# 2. Identify functions that need async conversion
# 3. Refactor functions to async/await
# 4. Update function calls throughout codebase
# 5. Run tests and fix any failures

print(result["todos"])  # Track the agent's progress through each step
```

<Accordion title="Configuration options">
  <ParamField body="system_prompt" type="string">
    Custom system prompt for guiding todo usage. Uses built-in prompt if not specified.
  </ParamField>

  <ParamField body="tool_description" type="string">
    Custom description for the `write_todos` tool. Uses built-in description if not specified.
  </ParamField>
</Accordion>

### LLM tool selector

Use an LLM to intelligently select relevant tools before calling the main model.

<Tip>
  **Perfect for:**

  * Agents with many tools (10+) where most aren't relevant per query
  * Reducing token usage by filtering irrelevant tools
  * Improving model focus and accuracy
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolSelectorMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[tool1, tool2, tool3, tool4, tool5, ...],  # Many tools
    middleware=[
        LLMToolSelectorMiddleware(
            model="gpt-4o-mini",  # Use cheaper model for selection
            max_tools=3,  # Limit to 3 most relevant tools
            always_include=["search"],  # Always include certain tools
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="model" type="string | BaseChatModel">
    Model for tool selection. Can be a model string or `BaseChatModel` instance. Defaults to the agent's main model.
  </ParamField>

  <ParamField body="system_prompt" type="string">
    Instructions for the selection model. Uses built-in prompt if not specified.
  </ParamField>

  <ParamField body="max_tools" type="number">
    Maximum number of tools to select. Defaults to no limit.
  </ParamField>

  <ParamField body="always_include" type="list[string]">
    List of tool names to always include in the selection
  </ParamField>
</Accordion>

### Tool retry

Automatically retry failed tool calls with configurable exponential backoff.

<Tip>
  **Perfect for:**

  * Handling transient failures in external API calls
  * Improving reliability of network-dependent tools
  * Building resilient agents that gracefully handle temporary errors
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import ToolRetryMiddleware


agent = create_agent(
    model="gpt-4o",
    tools=[search_tool, database_tool],
    middleware=[
        ToolRetryMiddleware(
            max_retries=3,  # Retry up to 3 times
            backoff_factor=2.0,  # Exponential backoff multiplier
            initial_delay=1.0,  # Start with 1 second delay
            max_delay=60.0,  # Cap delays at 60 seconds
            jitter=True,  # Add random jitter to avoid thundering herd
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="max_retries" type="number" default="2">
    Maximum number of retry attempts after the initial call (3 total attempts with default)
  </ParamField>

  <ParamField body="tools" type="list[BaseTool | str]">
    Optional list of tools or tool names to apply retry logic to. If `None`, applies to all tools.
  </ParamField>

  <ParamField body="retry_on" type="tuple[type[Exception], ...] | callable" default="(Exception,)">
    Either a tuple of exception types to retry on, or a callable that takes an exception and returns `True` if it should be retried.
  </ParamField>

  <ParamField body="on_failure" type="string | callable" default="return_message">
    Behavior when all retries are exhausted. Options:

    * `"return_message"` - Return a ToolMessage with error details (allows LLM to handle failure)
    * `"raise"` - Re-raise the exception (stops agent execution)
    * Custom callable - Function that takes the exception and returns a string for the ToolMessage content
  </ParamField>

  <ParamField body="backoff_factor" type="number" default="2.0">
    Multiplier for exponential backoff. Each retry waits `initial_delay * (backoff_factor ** retry_number)` seconds. Set to 0.0 for constant delay.
  </ParamField>

  <ParamField body="initial_delay" type="number" default="1.0">
    Initial delay in seconds before first retry
  </ParamField>

  <ParamField body="max_delay" type="number" default="60.0">
    Maximum delay in seconds between retries (caps exponential backoff growth)
  </ParamField>

  <ParamField body="jitter" type="boolean" default="true">
    Whether to add random jitter (±25%) to delay to avoid thundering herd
  </ParamField>
</Accordion>

### LLM tool emulator

Emulate tool execution using an LLM for testing purposes, replacing actual tool calls with AI-generated responses.

<Tip>
  **Perfect for:**

  * Testing agent behavior without executing real tools
  * Developing agents when external tools are unavailable or expensive
  * Prototyping agent workflows before implementing actual tools
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator


agent = create_agent(
    model="gpt-4o",
    tools=[get_weather, search_database, send_email],
    middleware=[
        # Emulate all tools by default
        LLMToolEmulator(),

        # Or emulate specific tools
        # LLMToolEmulator(tools=["get_weather", "search_database"]),

        # Or use a custom model for emulation
        # LLMToolEmulator(model="claude-sonnet-4-5-20250929"),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="tools" type="list[str | BaseTool]">
    List of tool names (str) or BaseTool instances to emulate. If `None` (default), ALL tools will be emulated. If empty list, no tools will be emulated.
  </ParamField>

  <ParamField body="model" type="string | BaseChatModel" default="anthropic:claude-3-5-sonnet-latest">
    Model to use for generating emulated tool responses. Can be a model identifier string or BaseChatModel instance.
  </ParamField>
</Accordion>

### Context editing

Manage conversation context by trimming, summarizing, or clearing tool uses.

<Tip>
  **Perfect for:**

  * Long conversations that need periodic context cleanup
  * Removing failed tool attempts from context
  * Custom context management strategies
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import ContextEditingMiddleware, ClearToolUsesEdit


agent = create_agent(
    model="gpt-4o",
    tools=[...],
    middleware=[
        ContextEditingMiddleware(
            edits=[
                ClearToolUsesEdit(trigger=1000),  # Clear old tool uses
            ],
        ),
    ],
)
```

<Accordion title="Configuration options">
  <ParamField body="edits" type="list[ContextEdit]" default="[ClearToolUsesEdit()]">
    List of `ContextEdit` strategies to apply
  </ParamField>

  <ParamField body="token_count_method" type="string" default="approximate">
    Token counting method. Options: `"approximate"` or `"model"`
  </ParamField>

  **[`ClearToolUsesEdit`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.ClearToolUsesEdit) options:**

  <ParamField body="trigger" type="number" default="100000">
    Token count that triggers the edit
  </ParamField>

  <ParamField body="clear_at_least" type="number" default="0">
    Minimum tokens to reclaim
  </ParamField>

  <ParamField body="keep" type="number" default="3">
    Number of recent tool results to preserve
  </ParamField>

  <ParamField body="clear_tool_inputs" type="boolean" default="False">
    Whether to clear tool call parameters
  </ParamField>

  <ParamField body="exclude_tools" type="list[string]" default="()">
    List of tool names to exclude from clearing
  </ParamField>

  <ParamField body="placeholder" type="string" default="[cleared]">
    Placeholder text for cleared outputs
  </ParamField>
</Accordion>

## Custom middleware

Build custom middleware by implementing hooks that run at specific points in the agent execution flow.

You can create middleware in two ways:

1. **Decorator-based** - Quick and simple for single-hook middleware
2. **Class-based** - More powerful for complex middleware with multiple hooks

## Decorator-based middleware

For simple middleware that only needs a single hook, decorators provide the quickest way to add functionality:

```python  theme={null}
from langchain.agents.middleware import before_model, after_model, wrap_model_call
from langchain.agents.middleware import AgentState, ModelRequest, ModelResponse, dynamic_prompt
from langchain.messages import AIMessage
from langchain.agents import create_agent
from langgraph.runtime import Runtime
from typing import Any, Callable


# Node-style: logging before model calls
@before_model
def log_before_model(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    print(f"About to call model with {len(state['messages'])} messages")
    return None

# Node-style: validation after model calls
@after_model(can_jump_to=["end"])
def validate_output(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    last_message = state["messages"][-1]
    if "BLOCKED" in last_message.content:
        return {
            "messages": [AIMessage("I cannot respond to that request.")],
            "jump_to": "end"
        }
    return None

# Wrap-style: retry logic
@wrap_model_call
def retry_model(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse],
) -> ModelResponse:
    for attempt in range(3):
        try:
            return handler(request)
        except Exception as e:
            if attempt == 2:
                raise
            print(f"Retry {attempt + 1}/3 after error: {e}")

# Wrap-style: dynamic prompts
@dynamic_prompt
def personalized_prompt(request: ModelRequest) -> str:
    user_id = request.runtime.context.get("user_id", "guest")
    return f"You are a helpful assistant for user {user_id}. Be concise and friendly."

# Use decorators in agent
agent = create_agent(
    model="gpt-4o",
    middleware=[log_before_model, validate_output, retry_model, personalized_prompt],
    tools=[...],
)
```

### Available decorators

**Node-style** (run at specific execution points):

* `@before_agent` - Before agent starts (once per invocation)
* [`@before_model`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.before_model) - Before each model call
* [`@after_model`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.after_model) - After each model response
* `@after_agent` - After agent completes (once per invocation)

**Wrap-style** (intercept and control execution):

* [`@wrap_model_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_model_call) - Around each model call
* [`@wrap_tool_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_tool_call) - Around each tool call

**Convenience decorators**:

* [`@dynamic_prompt`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.dynamic_prompt) - Generates dynamic system prompts (equivalent to [`@wrap_model_call`](https://reference.langchain.com/python/langchain/middleware/#langchain.agents.middleware.wrap_model_call) that modifies the prompt)

### When to use decorators

<CardGroup cols={2}>
  <Card title="Use decorators when" icon="check">
    • You need a single hook<br />
    • No complex configuration
  </Card>

  <Card title="Use classes when" icon="code">
    • Multiple hooks needed<br />
    • Complex configuration<br />
    • Reuse across projects (config on init)
  </Card>
</CardGroup>

## Class-based middleware

### Two hook styles

<CardGroup cols={2}>
  <Card title="Node-style hooks" icon="diagram-project">
    Run sequentially at specific execution points. Use for logging, validation, and state updates.
  </Card>

  <Card title="Wrap-style hooks" icon="arrows-rotate">
    Intercept execution with full control over handler calls. Use for retries, caching, and transformation.
  </Card>
</CardGroup>

#### Node-style hooks

Run at specific points in the execution flow:

* `before_agent` - Before agent starts (once per invocation)
* `before_model` - Before each model call
* `after_model` - After each model response
* `after_agent` - After agent completes (up to once per invocation)

**Example: Logging middleware**

```python  theme={null}
from langchain.agents.middleware import AgentMiddleware, AgentState
from langgraph.runtime import Runtime
from typing import Any

class LoggingMiddleware(AgentMiddleware):
    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        print(f"About to call model with {len(state['messages'])} messages")
        return None

    def after_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        print(f"Model returned: {state['messages'][-1].content}")
        return None
```

**Example: Conversation length limit**

```python  theme={null}
from langchain.agents.middleware import AgentMiddleware, AgentState
from langchain.messages import AIMessage
from langgraph.runtime import Runtime
from typing import Any

class MessageLimitMiddleware(AgentMiddleware):
    def __init__(self, max_messages: int = 50):
        super().__init__()
        self.max_messages = max_messages

    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        if len(state["messages"]) == self.max_messages:
            return {
                "messages": [AIMessage("Conversation limit reached.")],
                "jump_to": "end"
            }
        return None
```

#### Wrap-style hooks

Intercept execution and control when the handler is called:

* `wrap_model_call` - Around each model call
* `wrap_tool_call` - Around each tool call

You decide if the handler is called zero times (short-circuit), once (normal flow), or multiple times (retry logic).

**Example: Model retry middleware**

```python  theme={null}
from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from typing import Callable

class RetryMiddleware(AgentMiddleware):
    def __init__(self, max_retries: int = 3):
        super().__init__()
        self.max_retries = max_retries

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        for attempt in range(self.max_retries):
            try:
                return handler(request)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                print(f"Retry {attempt + 1}/{self.max_retries} after error: {e}")
```

**Example: Dynamic model selection**

```python  theme={null}
from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain.chat_models import init_chat_model
from typing import Callable

class DynamicModelMiddleware(AgentMiddleware):
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        # Use different model based on conversation length
        if len(request.messages) > 10:
            request.model = init_chat_model("gpt-4o")
        else:
            request.model = init_chat_model("gpt-4o-mini")

        return handler(request)
```

**Example: Tool call monitoring**

```python  theme={null}
from langchain.tools.tool_node import ToolCallRequest
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from typing import Callable

class ToolMonitoringMiddleware(AgentMiddleware):
    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        print(f"Executing tool: {request.tool_call['name']}")
        print(f"Arguments: {request.tool_call['args']}")

        try:
            result = handler(request)
            print(f"Tool completed successfully")
            return result
        except Exception as e:
            print(f"Tool failed: {e}")
            raise
```

### Custom state schema

Middleware can extend the agent's state with custom properties. Define a custom state type and set it as the `state_schema`:

```python  theme={null}
from langchain.agents.middleware import AgentState, AgentMiddleware
from typing_extensions import NotRequired
from typing import Any

class CustomState(AgentState):
    model_call_count: NotRequired[int]
    user_id: NotRequired[str]

class CallCounterMiddleware(AgentMiddleware[CustomState]):
    state_schema = CustomState

    def before_model(self, state: CustomState, runtime) -> dict[str, Any] | None:
        # Access custom state properties
        count = state.get("model_call_count", 0)

        if count > 10:
            return {"jump_to": "end"}

        return None

    def after_model(self, state: CustomState, runtime) -> dict[str, Any] | None:
        # Update custom state
        return {"model_call_count": state.get("model_call_count", 0) + 1}
```

```python  theme={null}
agent = create_agent(
    model="gpt-4o",
    middleware=[CallCounterMiddleware()],
    tools=[...],
)

# Invoke with custom state
result = agent.invoke({
    "messages": [HumanMessage("Hello")],
    "model_call_count": 0,
    "user_id": "user-123",
})
```

### Execution order

When using multiple middleware, understanding execution order is important:

```python  theme={null}
agent = create_agent(
    model="gpt-4o",
    middleware=[middleware1, middleware2, middleware3],
    tools=[...],
)
```

<Accordion title="Execution flow (click to expand)">
  **Before hooks run in order:**

  1. `middleware1.before_agent()`
  2. `middleware2.before_agent()`
  3. `middleware3.before_agent()`

  **Agent loop starts**

  5. `middleware1.before_model()`
  6. `middleware2.before_model()`
  7. `middleware3.before_model()`

  **Wrap hooks nest like function calls:**

  8. `middleware1.wrap_model_call()` → `middleware2.wrap_model_call()` → `middleware3.wrap_model_call()` → model

  **After hooks run in reverse order:**

  9. `middleware3.after_model()`
  10. `middleware2.after_model()`
  11. `middleware1.after_model()`

  **Agent loop ends**

  13. `middleware3.after_agent()`
  14. `middleware2.after_agent()`
  15. `middleware1.after_agent()`
</Accordion>

**Key rules:**

* `before_*` hooks: First to last
* `after_*` hooks: Last to first (reverse)
* `wrap_*` hooks: Nested (first middleware wraps all others)

### Agent jumps

To exit early from middleware, return a dictionary with `jump_to`:

```python  theme={null}
class EarlyExitMiddleware(AgentMiddleware):
    def before_model(self, state: AgentState, runtime) -> dict[str, Any] | None:
        # Check some condition
        if should_exit(state):
            return {
                "messages": [AIMessage("Exiting early due to condition.")],
                "jump_to": "end"
            }
        return None
```

Available jump targets:

* `"end"`: Jump to the end of the agent execution
* `"tools"`: Jump to the tools node
* `"model"`: Jump to the model node (or the first `before_model` hook)

**Important:** When jumping from `before_model` or `after_model`, jumping to `"model"` will cause all `before_model` middleware to run again.

To enable jumping, decorate your hook with `@hook_config(can_jump_to=[...])`:

```python  theme={null}
from langchain.agents.middleware import AgentMiddleware, hook_config
from typing import Any

class ConditionalMiddleware(AgentMiddleware):
    @hook_config(can_jump_to=["end", "tools"])
    def after_model(self, state: AgentState, runtime) -> dict[str, Any] | None:
        if some_condition(state):
            return {"jump_to": "end"}
        return None
```

### Best practices

1. Keep middleware focused - each should do one thing well
2. Handle errors gracefully - don't let middleware errors crash the agent
3. **Use appropriate hook types**:
   * Node-style for sequential logic (logging, validation)
   * Wrap-style for control flow (retry, fallback, caching)
4. Clearly document any custom state properties
5. Unit test middleware independently before integrating
6. Consider execution order - place critical middleware first in the list
7. Use built-in middleware when possible, don't reinvent the wheel :)

## Examples

### Dynamically selecting tools

Select relevant tools at runtime to improve performance and accuracy.

<Tip>
  **Benefits:**

  * **Shorter prompts** - Reduce complexity by exposing only relevant tools
  * **Better accuracy** - Models choose correctly from fewer options
  * **Permission control** - Dynamically filter tools based on user access
</Tip>

```python  theme={null}
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, ModelRequest
from typing import Callable


class ToolSelectorMiddleware(AgentMiddleware):
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        """Middleware to select relevant tools based on state/context."""
        # Select a small, relevant subset of tools based on state/context
        relevant_tools = select_relevant_tools(request.state, request.runtime)
        request.tools = relevant_tools
        return handler(request)

agent = create_agent(
    model="gpt-4o",
    tools=all_tools,  # All available tools need to be registered upfront
    # Middleware can be used to select a smaller subset that's relevant for the given run.
    middleware=[ToolSelectorMiddleware()],
)
```

<Expandable title="Extended example: GitHub vs GitLab tool selection">
  ```python  theme={null}
  from dataclasses import dataclass
  from typing import Literal, Callable

  from langchain.agents import create_agent
  from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
  from langchain_core.tools import tool


  @tool
  def github_create_issue(repo: str, title: str) -> dict:
      """Create an issue in a GitHub repository."""
      return {"url": f"https://github.com/{repo}/issues/1", "title": title}

  @tool
  def gitlab_create_issue(project: str, title: str) -> dict:
      """Create an issue in a GitLab project."""
      return {"url": f"https://gitlab.com/{project}/-/issues/1", "title": title}

  all_tools = [github_create_issue, gitlab_create_issue]

  @dataclass
  class Context:
      provider: Literal["github", "gitlab"]

  class ToolSelectorMiddleware(AgentMiddleware):
      def wrap_model_call(
          self,
          request: ModelRequest,
          handler: Callable[[ModelRequest], ModelResponse],
      ) -> ModelResponse:
          """Select tools based on the VCS provider."""
          provider = request.runtime.context.provider

          if provider == "gitlab":
              selected_tools = [t for t in request.tools if t.name == "gitlab_create_issue"]
          else:
              selected_tools = [t for t in request.tools if t.name == "github_create_issue"]

          request.tools = selected_tools
          return handler(request)

  agent = create_agent(
      model="gpt-4o",
      tools=all_tools,
      middleware=[ToolSelectorMiddleware()],
      context_schema=Context,
  )

  # Invoke with GitHub context
  agent.invoke(
      {
          "messages": [{"role": "user", "content": "Open an issue titled 'Bug: where are the cats' in the repository `its-a-cats-game`"}]
      },
      context=Context(provider="github"),
  )
  ```

  **Key points:**

  * Register all tools upfront
  * Middleware selects the relevant subset per request
  * Use `context_schema` for configuration requirements
</Expandable>

## Additional resources

* [Middleware API reference](https://reference.langchain.com/python/langchain/middleware/) - Complete guide to custom middleware
* [Human-in-the-loop](/oss/python/langchain/human-in-the-loop) - Add human review for sensitive operations
* [Testing agents](/oss/python/langchain/test) - Strategies for testing safety mechanisms

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


# Structured output

Structured output allows agents to return data in a specific, predictable format. Instead of parsing natural language responses, you get structured data in the form of JSON objects, Pydantic models, or dataclasses that your application can directly use.

LangChain's [`create_agent`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent) handles structured output automatically. The user sets their desired structured output schema, and when the model generates the structured data, it's captured, validated, and returned in the `'structured_response'` key of the agent's state.

```python  theme={null}
def create_agent(
    ...
    response_format: Union[
        ToolStrategy[StructuredResponseT],
        ProviderStrategy[StructuredResponseT],
        type[StructuredResponseT],
    ]
```

## Response Format

Controls how the agent returns structured data:

* **`ToolStrategy[StructuredResponseT]`**: Uses tool calling for structured output
* **`ProviderStrategy[StructuredResponseT]`**: Uses provider-native structured output
* **`type[StructuredResponseT]`**: Schema type - automatically selects best strategy based on model capabilities
* **`None`**: No structured output

When a schema type is provided directly, LangChain automatically chooses:

* `ProviderStrategy` for models supporting native structured output (e.g. [OpenAI](/oss/python/integrations/providers/openai), [Grok](/oss/python/integrations/providers/xai))
* `ToolStrategy` for all other models

The structured response is returned in the `structured_response` key of the agent's final state.

## Provider strategy

Some model providers support structured output natively through their APIs (currently only OpenAI and Grok). This is the most reliable method when available.

To use this strategy, configure a `ProviderStrategy`:

```python  theme={null}
class ProviderStrategy(Generic[SchemaT]):
    schema: type[SchemaT]
```

<ParamField path="schema" required>
  The schema defining the structured output format. Supports:

  * **Pydantic models**: `BaseModel` subclasses with field validation
  * **Dataclasses**: Python dataclasses with type annotations
  * **TypedDict**: Typed dictionary classes
  * **JSON Schema**: Dictionary with JSON schema specification
</ParamField>

LangChain automatically uses `ProviderStrategy` when you pass a schema type directly to [`create_agent.response_format`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent\(response_format\)) and the model supports native structured output:

<CodeGroup>
  ```python Pydantic Model theme={null}
  from pydantic import BaseModel
  from langchain.agents import create_agent


  class ContactInfo(BaseModel):
      """Contact information for a person."""
      name: str = Field(description="The name of the person")
      email: str = Field(description="The email address of the person")
      phone: str = Field(description="The phone number of the person")

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ContactInfo  # Auto-selects ProviderStrategy
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
  })

  result["structured_response"]
  # ContactInfo(name='John Doe', email='john@example.com', phone='(555) 123-4567')
  ```

  ```python Dataclass theme={null}
  from dataclasses import dataclass
  from langchain.agents import create_agent


  @dataclass
  class ContactInfo:
      """Contact information for a person."""
      name: str # The name of the person
      email: str # The email address of the person
      phone: str # The phone number of the person

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ContactInfo  # Auto-selects ProviderStrategy
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
  })

  result["structured_response"]
  # ContactInfo(name='John Doe', email='john@example.com', phone='(555) 123-4567')
  ```

  ```python TypedDict theme={null}
  from typing_extensions import TypedDict
  from langchain.agents import create_agent


  class ContactInfo(TypedDict):
      """Contact information for a person."""
      name: str # The name of the person
      email: str # The email address of the person
      phone: str # The phone number of the person

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ContactInfo  # Auto-selects ProviderStrategy
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
  })

  result["structured_response"]
  # {'name': 'John Doe', 'email': 'john@example.com', 'phone': '(555) 123-4567'}
  ```

  ```python JSON Schema theme={null}
  from langchain.agents import create_agent


  contact_info_schema = {
      "type": "object",
      "description": "Contact information for a person.",
      "properties": {
          "name": {"type": "string", "description": "The name of the person"},
          "email": {"type": "string", "description": "The email address of the person"},
          "phone": {"type": "string", "description": "The phone number of the person"}
      },
      "required": ["name", "email", "phone"]
  }

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=contact_info_schema  # Auto-selects ProviderStrategy
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
  })

  result["structured_response"]
  # {'name': 'John Doe', 'email': 'john@example.com', 'phone': '(555) 123-4567'}
  ```
</CodeGroup>

Provider-native structured output provides high reliability and strict validation because the model provider enforces the schema. Use it when available.

<Note>
  If the provider natively supports structured output for your model choice, it is functionally equivalent to write `response_format=ProductReview` instead of `response_format=ToolStrategy(ProductReview)`. In either case, if structured output is not supported, the agent will fall back to a tool calling strategy.
</Note>

## Tool calling strategy

For models that don't support native structured output, LangChain uses tool calling to achieve the same result. This works with all models that support tool calling, which is most modern models.

To use this strategy, configure a `ToolStrategy`:

```python  theme={null}
class ToolStrategy(Generic[SchemaT]):
    schema: type[SchemaT]
    tool_message_content: str | None
    handle_errors: Union[
        bool,
        str,
        type[Exception],
        tuple[type[Exception], ...],
        Callable[[Exception], str],
    ]
```

<ParamField path="schema" required>
  The schema defining the structured output format. Supports:

  * **Pydantic models**: `BaseModel` subclasses with field validation
  * **Dataclasses**: Python dataclasses with type annotations
  * **TypedDict**: Typed dictionary classes
  * **JSON Schema**: Dictionary with JSON schema specification
  * **Union types**: Multiple schema options. The model will choose the most appropriate schema based on the context.
</ParamField>

<ParamField path="tool_message_content">
  Custom content for the tool message returned when structured output is generated.
  If not provided, defaults to a message showing the structured response data.
</ParamField>

<ParamField path="handle_errors">
  Error handling strategy for structured output validation failures. Defaults to `True`.

  * **`True`**: Catch all errors with default error template
  * **`str`**: Catch all errors with this custom message
  * **`type[Exception]`**: Only catch this exception type with default message
  * **`tuple[type[Exception], ...]`**: Only catch these exception types with default message
  * **`Callable[[Exception], str]`**: Custom function that returns error message
  * **`False`**: No retry, let exceptions propagate
</ParamField>

<CodeGroup>
  ```python Pydantic Model theme={null}
  from pydantic import BaseModel, Field
  from typing import Literal
  from langchain.agents import create_agent
  from langchain.agents.structured_output import ToolStrategy


  class ProductReview(BaseModel):
      """Analysis of a product review."""
      rating: int | None = Field(description="The rating of the product", ge=1, le=5)
      sentiment: Literal["positive", "negative"] = Field(description="The sentiment of the review")
      key_points: list[str] = Field(description="The key points of the review. Lowercase, 1-3 words each.")

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ToolStrategy(ProductReview)
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Analyze this review: 'Great product: 5 out of 5 stars. Fast shipping, but expensive'"}]
  })
  result["structured_response"]
  # ProductReview(rating=5, sentiment='positive', key_points=['fast shipping', 'expensive'])
  ```

  ```python Dataclass theme={null}
  from dataclasses import dataclass
  from typing import Literal
  from langchain.agents import create_agent
  from langchain.agents.structured_output import ToolStrategy


  @dataclass
  class ProductReview:
      """Analysis of a product review."""
      rating: int | None  # The rating of the product (1-5)
      sentiment: Literal["positive", "negative"]  # The sentiment of the review
      key_points: list[str]  # The key points of the review

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ToolStrategy(ProductReview)
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Analyze this review: 'Great product: 5 out of 5 stars. Fast shipping, but expensive'"}]
  })
  result["structured_response"]
  # ProductReview(rating=5, sentiment='positive', key_points=['fast shipping', 'expensive'])
  ```

  ```python TypedDict theme={null}
  from typing import Literal
  from typing_extensions import TypedDict
  from langchain.agents import create_agent
  from langchain.agents.structured_output import ToolStrategy


  class ProductReview(TypedDict):
      """Analysis of a product review."""
      rating: int | None  # The rating of the product (1-5)
      sentiment: Literal["positive", "negative"]  # The sentiment of the review
      key_points: list[str]  # The key points of the review

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ToolStrategy(ProductReview)
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Analyze this review: 'Great product: 5 out of 5 stars. Fast shipping, but expensive'"}]
  })
  result["structured_response"]
  # {'rating': 5, 'sentiment': 'positive', 'key_points': ['fast shipping', 'expensive']}
  ```

  ```python JSON Schema theme={null}
  from langchain.agents import create_agent
  from langchain.agents.structured_output import ToolStrategy


  product_review_schema = {
      "type": "object",
      "description": "Analysis of a product review.",
      "properties": {
          "rating": {
              "type": ["integer", "null"],
              "description": "The rating of the product (1-5)",
              "minimum": 1,
              "maximum": 5
          },
          "sentiment": {
              "type": "string",
              "enum": ["positive", "negative"],
              "description": "The sentiment of the review"
          },
          "key_points": {
              "type": "array",
              "items": {"type": "string"},
              "description": "The key points of the review"
          }
      },
      "required": ["sentiment", "key_points"]
  }

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ToolStrategy(product_review_schema)
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Analyze this review: 'Great product: 5 out of 5 stars. Fast shipping, but expensive'"}]
  })
  result["structured_response"]
  # {'rating': 5, 'sentiment': 'positive', 'key_points': ['fast shipping', 'expensive']}
  ```

  ```python Union Types theme={null}
  from pydantic import BaseModel, Field
  from typing import Literal, Union
  from langchain.agents import create_agent
  from langchain.agents.structured_output import ToolStrategy


  class ProductReview(BaseModel):
      """Analysis of a product review."""
      rating: int | None = Field(description="The rating of the product", ge=1, le=5)
      sentiment: Literal["positive", "negative"] = Field(description="The sentiment of the review")
      key_points: list[str] = Field(description="The key points of the review. Lowercase, 1-3 words each.")

  class CustomerComplaint(BaseModel):
      """A customer complaint about a product or service."""
      issue_type: Literal["product", "service", "shipping", "billing"] = Field(description="The type of issue")
      severity: Literal["low", "medium", "high"] = Field(description="The severity of the complaint")
      description: str = Field(description="Brief description of the complaint")

  agent = create_agent(
      model="gpt-5",
      tools=tools,
      response_format=ToolStrategy(Union[ProductReview, CustomerComplaint])
  )

  result = agent.invoke({
      "messages": [{"role": "user", "content": "Analyze this review: 'Great product: 5 out of 5 stars. Fast shipping, but expensive'"}]
  })
  result["structured_response"]
  # ProductReview(rating=5, sentiment='positive', key_points=['fast shipping', 'expensive'])
  ```
</CodeGroup>

### Custom tool message content

The `tool_message_content` parameter allows you to customize the message that appears in the conversation history when structured output is generated:

```python  theme={null}
from pydantic import BaseModel, Field
from typing import Literal
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy


class MeetingAction(BaseModel):
    """Action items extracted from a meeting transcript."""
    task: str = Field(description="The specific task to be completed")
    assignee: str = Field(description="Person responsible for the task")
    priority: Literal["low", "medium", "high"] = Field(description="Priority level")

agent = create_agent(
    model="gpt-5",
    tools=[],
    response_format=ToolStrategy(
        schema=MeetingAction,
        tool_message_content="Action item captured and added to meeting notes!"
    )
)

agent.invoke({
    "messages": [{"role": "user", "content": "From our meeting: Sarah needs to update the project timeline as soon as possible"}]
})
```

```
================================ Human Message =================================

From our meeting: Sarah needs to update the project timeline as soon as possible
================================== Ai Message ==================================
Tool Calls:
  MeetingAction (call_1)
 Call ID: call_1
  Args:
    task: Update the project timeline
    assignee: Sarah
    priority: high
================================= Tool Message =================================
Name: MeetingAction

Action item captured and added to meeting notes!
```

Without `tool_message_content`, our final [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) would be:

```
================================= Tool Message =================================
Name: MeetingAction

Returning structured response: {'task': 'update the project timeline', 'assignee': 'Sarah', 'priority': 'high'}
```

### Error handling

Models can make mistakes when generating structured output via tool calling. LangChain provides intelligent retry mechanisms to handle these errors automatically.

#### Multiple structured outputs error

When a model incorrectly calls multiple structured output tools, the agent provides error feedback in a [`ToolMessage`](https://reference.langchain.com/python/langchain/messages/#langchain.messages.ToolMessage) and prompts the model to retry:

```python  theme={null}
from pydantic import BaseModel, Field
from typing import Union
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy


class ContactInfo(BaseModel):
    name: str = Field(description="Person's name")
    email: str = Field(description="Email address")

class EventDetails(BaseModel):
    event_name: str = Field(description="Name of the event")
    date: str = Field(description="Event date")

agent = create_agent(
    model="gpt-5",
    tools=[],
    response_format=ToolStrategy(Union[ContactInfo, EventDetails])  # Default: handle_errors=True
)

agent.invoke({
    "messages": [{"role": "user", "content": "Extract info: John Doe (john@email.com) is organizing Tech Conference on March 15th"}]
})
```

```
================================ Human Message =================================

Extract info: John Doe (john@email.com) is organizing Tech Conference on March 15th
None
================================== Ai Message ==================================
Tool Calls:
  ContactInfo (call_1)
 Call ID: call_1
  Args:
    name: John Doe
    email: john@email.com
  EventDetails (call_2)
 Call ID: call_2
  Args:
    event_name: Tech Conference
    date: March 15th
================================= Tool Message =================================
Name: ContactInfo

Error: Model incorrectly returned multiple structured responses (ContactInfo, EventDetails) when only one is expected.
 Please fix your mistakes.
================================= Tool Message =================================
Name: EventDetails

Error: Model incorrectly returned multiple structured responses (ContactInfo, EventDetails) when only one is expected.
 Please fix your mistakes.
================================== Ai Message ==================================
Tool Calls:
  ContactInfo (call_3)
 Call ID: call_3
  Args:
    name: John Doe
    email: john@email.com
================================= Tool Message =================================
Name: ContactInfo

Returning structured response: {'name': 'John Doe', 'email': 'john@email.com'}
```

#### Schema validation error

When structured output doesn't match the expected schema, the agent provides specific error feedback:

```python  theme={null}
from pydantic import BaseModel, Field
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy


class ProductRating(BaseModel):
    rating: int | None = Field(description="Rating from 1-5", ge=1, le=5)
    comment: str = Field(description="Review comment")

agent = create_agent(
    model="gpt-5",
    tools=[],
    response_format=ToolStrategy(ProductRating),  # Default: handle_errors=True
    system_prompt="You are a helpful assistant that parses product reviews. Do not make any field or value up."
)

agent.invoke({
    "messages": [{"role": "user", "content": "Parse this: Amazing product, 10/10!"}]
})
```

```
================================ Human Message =================================

Parse this: Amazing product, 10/10!
================================== Ai Message ==================================
Tool Calls:
  ProductRating (call_1)
 Call ID: call_1
  Args:
    rating: 10
    comment: Amazing product
================================= Tool Message =================================
Name: ProductRating

Error: Failed to parse structured output for tool 'ProductRating': 1 validation error for ProductRating.rating
  Input should be less than or equal to 5 [type=less_than_equal, input_value=10, input_type=int].
 Please fix your mistakes.
================================== Ai Message ==================================
Tool Calls:
  ProductRating (call_2)
 Call ID: call_2
  Args:
    rating: 5
    comment: Amazing product
================================= Tool Message =================================
Name: ProductRating

Returning structured response: {'rating': 5, 'comment': 'Amazing product'}
```

#### Error handling strategies

You can customize how errors are handled using the `handle_errors` parameter:

**Custom error message:**

```python  theme={null}
ToolStrategy(
    schema=ProductRating,
    handle_errors="Please provide a valid rating between 1-5 and include a comment."
)
```

If `handle_errors` is a string, the agent will *always* prompt the model to re-try with a fixed tool message:

```
================================= Tool Message =================================
Name: ProductRating

Please provide a valid rating between 1-5 and include a comment.
```

**Handle specific exceptions only:**

```python  theme={null}
ToolStrategy(
    schema=ProductRating,
    handle_errors=ValueError  # Only retry on ValueError, raise others
)
```

If `handle_errors` is an exception type, the agent will only retry (using the default error message) if the exception raised is the specified type. In all other cases, the exception will be raised.

**Handle multiple exception types:**

```python  theme={null}
ToolStrategy(
    schema=ProductRating,
    handle_errors=(ValueError, TypeError)  # Retry on ValueError and TypeError
)
```

If `handle_errors` is a tuple of exceptions, the agent will only retry (using the default error message) if the exception raised is one of the specified types. In all other cases, the exception will be raised.

**Custom error handler function:**

```python  theme={null}
def custom_error_handler(error: Exception) -> str:
    if isinstance(error, StructuredOutputValidationError):
        return "There was an issue with the format. Try again.
    elif isinstance(error, MultipleStructuredOutputsError):
        return "Multiple structured outputs were returned. Pick the most relevant one."
    else:
        return f"Error: {str(error)}"

ToolStrategy(
    schema=ToolStrategy(Union[ContactInfo, EventDetails]),
    handle_errors=custom_error_handler
)
```

On `StructuredOutputValidationError`:

```
================================= Tool Message =================================
Name: ToolStrategy

There was an issue with the format. Try again.
```

On `MultipleStructuredOutputsError`:

```
================================= Tool Message =================================
Name: ToolStrategy

Multiple structured outputs were returned. Pick the most relevant one.
```

On other errors:

```
================================= Tool Message =================================
Name: ToolStrategy

Error: <error message>
```

**No error handling:**

```python  theme={null}
response_format = ToolStrategy(
    schema=ProductRating,
    handle_errors=False  # All errors raised
)
```

***

<Callout icon="pen-to-square" iconType="regular">
  [Edit the source of this page on GitHub.](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/structured-output.mdx)
</Callout>

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/use-these-docs) to Claude, VSCode, and more via MCP for    real-time answers.
</Tip>


