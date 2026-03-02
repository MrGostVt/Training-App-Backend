import { UUID } from "crypto";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity({name: 'Article'})
export class ArticleEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    title: string;

    @Column()
    header: string;

    @Column()
    description: string;

    @Column()
    background: string;

    @Column({name: 'icon_path', nullable: true, type: 'varchar'})
    image?: string | null;

    @ManyToOne(() => UserEntity, (user) => user.articles)
    author: UserEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}