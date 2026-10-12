# Future Stage Interface: Repository Memory (pgvector / vector store)
class RepositoryMemory:
    """Interface for long-term vector-indexed repository memory."""
    async def index_repository(self, repo_url: str):
        pass

    async def query_similar_bugs(self, bug_report: str):
        pass
