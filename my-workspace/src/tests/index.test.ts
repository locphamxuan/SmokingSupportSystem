import { MyComponent } from '../components/index';
import { formatDate, calculateSum } from '../utils/index';

describe('MyComponent', () => {
    let component: MyComponent;

    beforeEach(() => {
        component = new MyComponent();
    });

    test('should render correctly', () => {
        const output = component.render();
        expect(output).toBe('<div>MyComponent</div>'); // Example output
    });

    test('should update correctly', () => {
        component.update('New Content');
        const output = component.render();
        expect(output).toBe('<div>New Content</div>'); // Example output
    });
});

describe('Utility Functions', () => {
    test('formatDate should format date correctly', () => {
        const date = new Date('2023-01-01');
        expect(formatDate(date)).toBe('January 1, 2023'); // Example output
    });

    test('calculateSum should return the correct sum', () => {
        expect(calculateSum(1, 2)).toBe(3);
        expect(calculateSum(-1, 1)).toBe(0);
    });
});