import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column()
  // productId: number;

  // @Column() // เพิ่ม decorator @Column() สำหรับ property quantity
  // totalAmount: number;

  @Column() 
  totalPrice: number;

  @Column() 
  status: number;

  @Column() 
  userId: number;

  @Column() // กำหนดให้ addressId เป็น nullable หาก status เป็น 1
  addressId: number;

  @Column() // กำหนดให้ addressId เป็น nullable หาก status เป็น 1
  buyType: string;

  @CreateDateColumn()
    order_at: Date;
}
