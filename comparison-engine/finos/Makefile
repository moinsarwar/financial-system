COMPOSE_DEV=docker compose -f docker-compose.dev.yml  
COMPOSE_PROD=docker compose -f docker-compose.prod.yml  
  
dev:  
	$(COMPOSE_DEV) up --build  
  
prod:  
	$(COMPOSE_PROD) up -d --build  
  
migrate:  
	$(COMPOSE_DEV) exec backend alembic upgrade head  
  
seed:  
	$(COMPOSE_DEV) exec backend python -m app.scripts.seed_demo  
  
test:  
	$(COMPOSE_DEV) exec backend pytest  
  
logs:  
	$(COMPOSE_DEV) logs -f  
  
down:  
	$(COMPOSE_DEV) down
