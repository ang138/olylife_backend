import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Review{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    comment: string;

    @Column()
    productId: number;

    @Column()
    userId: number;

    @CreateDateColumn()
    review_at: Date;
}