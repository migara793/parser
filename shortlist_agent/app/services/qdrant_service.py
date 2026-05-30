from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer
from app.config import get_settings

settings = get_settings()

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
        self.model = SentenceTransformer(settings.embedding_model)
        self.job_collection = "job_descriptions"
        self.candidate_collection = "candidates"
        self._ensure_collections()

    def _ensure_collections(self):
        for collection in [self.job_collection, self.candidate_collection]:
            try:
                self.client.get_collection(collection)
            except Exception:
                self.client.create_collection(
                    collection_name=collection,
                    vectors_config=models.VectorParams(
                        size=384,
                        distance=models.Distance.COSINE
                    )
                )

    def upsert_job(self, job_id: str, text: str, metadata: dict):
        vector = self.model.encode(text).tolist()
        self.client.upsert(
            collection_name=self.job_collection,
            points=[
                models.PointStruct(
                    id=job_id,
                    vector=vector,
                    payload=metadata
                )
            ]
        )

    def get_job(self, job_id: str):
        result = self.client.retrieve(
            collection_name=self.job_collection,
            ids=[job_id],
            with_vectors=True
        )
        return result[0] if result else None

    def list_jobs(self, limit: int = 100):
        # Using scroll to get all points in the collection
        results, _ = self.client.scroll(
            collection_name=self.job_collection,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        return results

    def upsert_candidate(self, candidate_id: str, text: str, metadata: dict):
        vector = self.model.encode(text).tolist()
        self.client.upsert(
            collection_name=self.candidate_collection,
            points=[
                models.PointStruct(
                    id=candidate_id,
                    vector=vector,
                    payload=metadata
                )
            ]
        )

    def search_candidates(self, job_vector: list, limit: int = 10):
        return self.client.search(
            collection_name=self.candidate_collection,
            query_vector=job_vector,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
