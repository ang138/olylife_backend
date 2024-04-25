import { Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column() // เพิ่ม decorator @Column() สำหรับ property quantity
  quantity: number;

  @Column() 
  price: number;

  // @Column() 
  // status: number;

  @Column() 
  userId: number;

  // @Column({ nullable: true }) // กำหนดให้ addressId เป็น nullable หาก status เป็น 1
  // addressId: number | null;
}
