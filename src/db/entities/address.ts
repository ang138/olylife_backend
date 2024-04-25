import { Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  tel: string;

  @Column() 
  address: string;

  @Column() 
  userId: number;
}
