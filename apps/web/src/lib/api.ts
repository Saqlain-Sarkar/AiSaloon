// src/lib/api.ts
import { fetchApi } from "./apiClient";

export async function fetchAppointments() {
  return fetchApi('/appointments', { cache: 'no-store' });
}

export async function createAppointment(data: any) {
  return fetchApi('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointmentStatus(id: string, data: { status: string, paymentStatus?: string, paymentMethod?: string }) {
  return fetchApi(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchCustomers() {
  return fetchApi('/customers', { cache: 'no-store' });
}

export async function createCustomer(data: any) {
  return fetchApi('/customers/lookup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchServices() {
  return fetchApi('/services', { cache: 'no-store' });
}

export async function createService(data: any) {
  return fetchApi('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: string, data: any) {
  return fetchApi(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string) {
  return fetchApi(`/services/${id}`, { method: 'DELETE' });
}

export async function fetchCategories() {
  return fetchApi('/categories', { cache: 'no-store' });
}

export async function createCategory(data: any) {
  return fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: any) {
  return fetchApi(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return fetchApi(`/categories/${id}`, { method: 'DELETE' });
}

export async function fetchEmployees() {
  return fetchApi('/employees', { cache: 'no-store' });
}

export async function createEmployee(data: any) {
  return fetchApi('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(id: string, data: any) {
  return fetchApi(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string) {
  return fetchApi(`/employees/${id}`, { method: 'DELETE' });
}

export async function fetchAnalyticsRevenue(startDate: string, endDate: string) {
  return fetchApi(`/analytics/revenue?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' });
}

export async function fetchAnalyticsPopularServices(startDate: string, endDate: string) {
  return fetchApi(`/analytics/popular-services?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' });
}

export async function fetchAnalyticsEmployeePerformance(startDate: string, endDate: string) {
  return fetchApi(`/analytics/employee-performance?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' });
}

export async function fetchConversations() {
  return fetchApi('/conversations', { cache: 'no-store' });
}

export async function fetchConversationById(id: string) {
  return fetchApi(`/conversations/${id}`, { cache: 'no-store' });
}

export async function takeoverChat(id: string, isAiManaging: boolean) {
  return fetchApi(`/conversations/${id}/takeover`, {
    method: 'POST',
    body: JSON.stringify({ isAiManaging }),
  });
}

export async function sendManualMessage(id: string, content: string) {
  return fetchApi(`/conversations/${id}/messages/send`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
