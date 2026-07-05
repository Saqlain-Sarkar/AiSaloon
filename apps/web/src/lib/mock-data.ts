import { subDays, subMonths, format } from "date-fns";

export type Appointment = {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: Date;
  time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  price: number;
  isReturning: boolean;
};

const today = new Date();

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Today
  { id: "1", name: "Sarah Jenkins", phone: "+1 (555) 123-4567", service: "Hair Coloring", date: today, time: "10:00 AM", status: "confirmed", price: 120, isReturning: true },
  { id: "2", name: "Mike Ross", phone: "+1 (555) 987-6543", service: "Classic Haircut", date: today, time: "11:00 AM", status: "pending", price: 40, isReturning: false },
  { id: "3", name: "Emma Watson", phone: "+1 (555) 456-7890", service: "Hair Botox", date: today, time: "01:00 PM", status: "confirmed", price: 150, isReturning: true },
  
  // Yesterday
  { id: "4", name: "Rachel Green", phone: "+1 (555) 234-5678", service: "Wash & Style", date: subDays(today, 1), time: "02:00 PM", status: "completed", price: 65, isReturning: true },
  { id: "5", name: "John Doe", phone: "+1 (555) 345-6789", service: "Classic Haircut", date: subDays(today, 1), time: "04:00 PM", status: "completed", price: 40, isReturning: false },
  
  // Last Week
  { id: "6", name: "Emily Clark", phone: "+1 (555) 876-5432", service: "Balayage", date: subDays(today, 5), time: "09:00 AM", status: "completed", price: 200, isReturning: true },
  { id: "7", name: "David Smith", phone: "+1 (555) 765-4321", service: "Beard Trim", date: subDays(today, 6), time: "11:30 AM", status: "cancelled", price: 25, isReturning: false },
  
  // This Month
  { id: "8", name: "Jessica Day", phone: "+1 (555) 111-2222", service: "Hair Coloring", date: subDays(today, 15), time: "10:00 AM", status: "completed", price: 120, isReturning: true },
  { id: "9", name: "Nick Miller", phone: "+1 (555) 333-4444", service: "Classic Haircut", date: subDays(today, 20), time: "01:00 PM", status: "completed", price: 40, isReturning: true },
  
  // Last Month
  { id: "10", name: "Schmidt", phone: "+1 (555) 555-6666", service: "Wash & Style", date: subMonths(today, 1), time: "03:00 PM", status: "completed", price: 65, isReturning: true },
  { id: "11", name: "Winston", phone: "+1 (555) 777-8888", service: "Classic Haircut", date: subDays(subMonths(today, 1), 5), time: "11:00 AM", status: "completed", price: 40, isReturning: false },
];
