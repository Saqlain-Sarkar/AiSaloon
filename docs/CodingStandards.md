# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` unless absolutely necessary (use `unknown` + type guards)
- Prefer interfaces over types for objects
- Use enums for fixed sets of values
- All functions must have explicit return types

## NestJS Conventions

- Modules follow domain boundaries (one module per business domain)
- Services contain business logic; controllers only handle HTTP
- DTOs use `class-validator` decorators for validation
- Repository pattern via Prisma service (no direct Prisma calls outside services)
- Use `@Public()` decorator for unauthenticated endpoints
- Use `@Roles()` decorator for RBAC

## Naming

- Files: `kebab-case` (auth.service.ts, appointment-engine.service.ts)
- Classes: `PascalCase`
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums: `PascalCase`
- DTOs: PascalCase with `Dto` suffix
- Interfaces: PascalCase with optional `I` prefix (prefer no prefix)

## Testing

- Unit tests: `*.spec.ts` alongside the source file
- E2E tests: in `tests/e2e/`
- Mock external services (AI, database) in unit tests
- Aim for 80%+ coverage on business logic

## Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Feature branches from `develop`
- PRs require at least one review

## Project Structure

```
apps/api/src/
├── main.ts
├── app.module.ts
├── prisma/          # Database client
├── common/          # Shared guards, decorators, pipes
├── modules/         # Business domain modules
│   ├── auth/
│   ├── business/
│   ├── appointments/
│   └── ...
├── config/          # Configuration
└── database/        # Migrations, seeds
```
