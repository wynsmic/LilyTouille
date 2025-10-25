import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findByAuth0Id(auth0Id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: Partial<UserEntity>): Promise<UserEntity>;
  update(id: number, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: number): Promise<boolean>;
  findById(id: number): Promise<UserEntity | null>;
}
