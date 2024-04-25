import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class OrderProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  @Column() // เพิ่ม decorator @Column() สำหรับ property quantity
  totalAmount: number;

  @Column() 
  totalPrice: number;

  @Column() 
  reviewStatus: number;
}
