import { createHash } from 'crypto';

export class CompositeHash {
  private constructor(private readonly value: string) {}

  public static create(vkn: string, date: string, receiptNo: string, totalAmount: number): CompositeHash {
    const sanitizedVkn = vkn.trim();
    const sanitizedDate = date.trim();
    const sanitizedReceiptNo = receiptNo.trim();
    const formattedAmount = totalAmount.toFixed(2);

    const rawPayload = `${sanitizedVkn}_${sanitizedDate}_${sanitizedReceiptNo}_${formattedAmount}`;
    const hash = createHash('sha256').update(rawPayload).digest('hex');

    return new CompositeHash(hash);
  }

  public getValue(): string {
    return this.value;
  }
}
