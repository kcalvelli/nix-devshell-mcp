console.log('Hello from TypeScript!');

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(greet('World'));
}
