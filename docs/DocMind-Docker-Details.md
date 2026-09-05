# Create a Docker network
- docker network create docmind-network
	
# Pull and Run Postgre Vector DB 
- docker pull pgvector/pgvector:pg16
- docker run -d --name pgvector-db --network docmind-network -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=docmind_db -p 5434:5432 -v pgvector_data:/var/lib/postgresql pgvector/pgvector:pg16

# Run pgAdmin for to work with DB using GUI 
	
- docker run -d --name pgadmin --network docmind-network -e PGADMIN_DEFAULT_EMAIL=admin@example.com -e PGADMIN_DEFAULT_PASSWORD=admin -p 5050:80 dpage/pgadmin4:latest 

# Pull and Run Ollama in Container
- docker run -d --name ollama --network docmind-network -p 11434:11434 -v ollama_data:/root/.ollama ollama/ollama
- docker exec -it ollama ollama pull codellama  -------> download codellama model