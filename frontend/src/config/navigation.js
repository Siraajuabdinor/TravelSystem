import { BookOpen, Building2, CalendarRange, IdCard, LayoutDashboard, Link2, Map, Truck, Users } from 'lucide-react';

export const navigationItems = [
  {
    label: 'Dashboard',
    description: 'Overview and quick stats',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Admin'],
  },
  {
    label: 'Bookings',
    description: 'Create and review route bookings',
    path: '/bookings',
    icon: BookOpen,
  },
  {
    label: 'Cities',
    description: 'Manage transport cities',
    path: '/cities',
    icon: Building2,
    roles: ['Admin'],
  },
  {
    label: 'Vehicles',
    description: 'Manage fleet records',
    path: '/vehicles',
    icon: Truck,
    roles: ['Admin'],
  },
  {
    label: 'Routes',
    description: 'Manage travel connections',
    path: '/routes',
    icon: Map,
    roles: ['Admin'],
  },
  {
    label: 'Trips',
    description: 'Plan trips from route bookings',
    path: '/trips',
    icon: CalendarRange,
    roles: ['Admin'],
  },
  {
    label: 'Drivers',
    description: 'Manage driver profiles and licenses',
    path: '/drivers',
    icon: IdCard,
    roles: ['Admin'],
  },
  {
    label: 'Assignments',
    description: 'Assign drivers to vehicles',
    path: '/vehicle-drivers',
    icon: Link2,
    roles: ['Admin'],
  },
  {
    label: 'Users',
    description: 'Create and manage system users',
    path: '/users',
    icon: Users,
    roles: ['Admin'],
  },
];

export const pageCopy = {
  '/dashboard': {
    title: 'Transport Dashboard',
    description: 'A quick view of the data currently exposed by your backend API.',
  },
  '/bookings': {
    title: 'Bookings',
    description: 'Collect route demand first, then assign selected bookings to planned trips later.',
  },
  '/cities': {
    title: 'Cities',
    description: 'Create, update, and delete city records used by routes.',
  },
  '/vehicles': {
    title: 'Vehicles',
    description: 'Register fleet items and keep plate numbers organized.',
  },
  '/routes': {
    title: 'Routes',
    description: 'Link origin and destination cities with distance and travel time.',
  },
  '/trips': {
    title: 'Trips',
    description: 'Select pending bookings for a route, then assign vehicle, driver, and schedule details.',
  },
  '/drivers': {
    title: 'Drivers',
    description: 'Assign license details to users whose role is set to Driver.',
  },
  '/vehicle-drivers': {
    title: 'Vehicle Assignments',
    description: 'Track which driver is assigned to each vehicle over time.',
  },
  '/users': {
    title: 'Users',
    description: 'Create and manage customer, driver, and admin accounts after login.',
  },
};
