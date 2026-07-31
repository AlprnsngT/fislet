import { CompositeHash } from '../value-objects/composite_hash.vo';

export enum ReceiptStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  DUPLICATE = 'DUPLICATE',
}

export interface ReceiptProps {
  id?: string;
  userId: string;
  receiptHash: string;
  imageUrl: string;
  vkn?: string;
  receiptNo?: string;
  receiptDate?: Date;
  totalAmount: number;
  cashbackAmount: number;
  status: ReceiptStatus;
  rawOcrText?: string;
  ocrEngineUsed?: string;
  fallbackUsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReceiptEntity {
  constructor(private readonly props: ReceiptProps) {}

  public static create(
    userId: string,
    imageUrl: string,
    vkn: string,
    receiptNo: string,
    receiptDate: Date,
    totalAmount: number,
    rawOcrText: string,
    ocrEngineUsed: string,
    fallbackUsed: boolean
  ): ReceiptEntity {
    const hash = CompositeHash.create(vkn, receiptDate.toISOString(), receiptNo, totalAmount).getValue();
    const cashbackRate = 0.05; // 5% cashback reward
    const cashbackAmount = Math.round(totalAmount * cashbackRate * 100) / 100;

    return new ReceiptEntity({
      userId,
      receiptHash: hash,
      imageUrl,
      vkn,
      receiptNo,
      receiptDate,
      totalAmount,
      cashbackAmount,
      status: ReceiptStatus.PROCESSED,
      rawOcrText,
      ocrEngineUsed,
      fallbackUsed,
    });
  }

  public toJSON(): ReceiptProps {
    return { ...this.props };
  }

  get hash(): string {
    return this.props.receiptHash;
  }

  get cashback(): number {
    return this.props.cashbackAmount;
  }
}
