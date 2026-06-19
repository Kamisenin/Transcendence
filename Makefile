MODE ?= prod

ifeq ($(MODE),dev)
	ADDRESS := host.parent
	NEXT_RUN := npm run dev --prefix srcs/next/
	PROFILE_FLAG :=
else
	ADDRESS := next
	PROFILE_FLAG := --profile prod
	NEXT_RUN :=
endif

DOCKER_COMPOSE = docker compose
export ADDRESS

upb:
	@echo "ADDRESS vaut : $(ADDRESS)"
	@echo "running 42chan in $(MODE) mode"
	$(DOCKER_COMPOSE) $(PROFILE_FLAG) up --build
	$(NEXT_RUN)

up:
	@echo "running 42chan in $(MODE) mode"
	$(DOCKER_COMPOSE) $(PROFILE_FLAG) up
	$(NEXT_RUN)

build:
	$(DOCKER_COMPOSE) $(PROFILE_FLAG) build

down:
	$(DOCKER_COMPOSE) $(PROFILE_FLAG) down

clean: down
	docker system prune -af

fclean:
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -af --volumes
	docker volume prune -af

re: down clean upb

.PHONY: upb up build down re clean fclean