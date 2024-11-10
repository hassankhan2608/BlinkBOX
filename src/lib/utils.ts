import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { faker } from '@faker-js/faker';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateEmailUsername(): string {
  const types = [
    () => faker.person.firstName() + faker.person.lastName(),
    () => faker.internet.userName(),
    () => faker.hacker.adjective() + faker.hacker.noun(),
    () => faker.animal.type() + faker.number.int({ min: 100, max: 999 }),
    () => faker.color.human() + faker.commerce.product(),
    () => faker.internet.domainWord() + faker.number.int({ min: 1000, max: 9999 }),
  ];

  const generator = faker.helpers.arrayElement(types);
  return generator().toLowerCase().replace(/[^a-z0-9]/g, '');
}