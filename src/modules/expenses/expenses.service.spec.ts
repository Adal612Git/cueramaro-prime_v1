import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  it('should store expenses', () => {
    const service = new ExpensesService();
    const expense = service.create({
      concept: 'Papelería',
      amount: 50,
      attachmentUrl: 'local://ticket.jpg'
    });
    expect(service.findAll()[0]).toMatchObject({ concept: 'Papelería' });
    service.update(expense.id, { amount: 55 });
    expect(service.findAll()[0].amount).toBe(55);
  });
});
