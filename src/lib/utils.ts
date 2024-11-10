import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { faker } from '@faker-js/faker';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateEmailUsername(): string {
  const types = [
    () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const numbers = faker.number.int({ min: 10, max: 99 });
      return `${firstName.toLowerCase()}-${lastName.toLowerCase()}${numbers}`;
    },
    () => `${faker.internet.userName()}${faker.number.int({ min: 10, max: 99 })}`,
    () => `${faker.hacker.adjective()}-${faker.hacker.noun()}${faker.number.int({ min: 10, max: 99 })}`,
    () => `${faker.animal.type()}-${faker.number.int({ min: 100, max: 999 })}`,
    () => `${faker.color.human()}-${faker.commerce.product()}${faker.number.int({ min: 10, max: 99 })}`,
    () => `${faker.internet.domainWord()}-${faker.number.int({ min: 1000, max: 9999 })}`,
  ];

  const generator = faker.helpers.arrayElement(types);
  return generator().toLowerCase().replace(/[^a-z0-9-]/g, '');
}