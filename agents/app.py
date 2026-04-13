from agno.os import AgentOS

from . import file_helper_agent, rk_helper_agent

agent_os = AgentOS(agents=[rk_helper_agent.rk_helper, file_helper_agent.file_helper])
app = agent_os.get_app()
