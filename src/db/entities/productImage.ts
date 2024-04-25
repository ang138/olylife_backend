import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;
  
  // @Column()
  // originalname: string;

  @Column()
  filename: string;

  @Column()
  path: string;

  @Column()
  productId: number;

  // สามารถเพิ่ม properties เพิ่มเติมได้ตามต้องการ
}