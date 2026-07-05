# API Reference

Base URL: `/api/v1`

Authentication: Bearer JWT token in `Authorization` header.

## Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh access token |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/logout` | Yes | Logout |

### Business
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/business` | Yes | Create business |
| GET | `/business/:id` | No | Get business details |
| GET | `/business/:id/branches` | Yes | List branches |
| POST | `/business/:id/branches` | Yes | Add branch |
| GET | `/business/:id/working-hours` | Yes | Get working hours |
| GET | `/business/:id/holidays` | Yes | Get holidays |

### Services
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/services` | Yes | Create service |
| GET | `/services` | No | List services |
| GET | `/services/:id` | No | Get service |
| PATCH | `/services/:id` | Yes | Update service |
| DELETE | `/services/:id` | Yes | Soft delete service |

### Appointments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/appointments` | Yes | Create appointment |
| GET | `/appointments` | Yes | List appointments |
| GET | `/appointments/:id` | Yes | Get appointment |
| PATCH | `/appointments/:id/reschedule` | Yes | Reschedule |
| PATCH | `/appointments/:id/cancel` | Yes | Cancel |
| PATCH | `/appointments/:id/status` | Yes | Update status |
| GET | `/appointments/slots/available` | No | Get available slots |
| POST | `/appointments/slots/validate` | Yes | Validate slot |
| GET | `/appointments/slots/employees` | No | Get available employees |

### Customers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/customers` | Yes | Create customer |
| GET | `/customers` | Yes | List customers |
| GET | `/customers/:id` | Yes | Get customer profile |
| GET | `/customers/:id/appointments` | Yes | Customer appointments |
| GET | `/customers/:id/conversations` | Yes | Customer conversations |
| GET | `/customers/:id/insights` | Yes | Customer analytics |
| PATCH | `/customers/:id` | Yes | Update customer |
| POST | `/customers/lookup` | Yes | Find or create customer |

### Conversations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/conversations/message` | No | Send message to AI |
| GET | `/conversations` | Yes | List conversations |
| GET | `/conversations/:id` | Yes | Get conversation |
| GET | `/conversations/:id/messages` | Yes | Get messages |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/today` | Yes | Today's summary |
| GET | `/dashboard/stats` | Yes | Period statistics |
| GET | `/dashboard/leads` | Yes | Lead overview |
| GET | `/dashboard/upcoming` | Yes | Upcoming appointments |
