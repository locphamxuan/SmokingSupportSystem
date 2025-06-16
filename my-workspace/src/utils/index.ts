export function formatDate(date: Date, format: string): string {
    // Implementation for formatting the date
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function calculateSum(numbers: number[]): number {
    // Implementation for calculating the sum of an array of numbers
    return numbers.reduce((acc, curr) => acc + curr, 0);
}