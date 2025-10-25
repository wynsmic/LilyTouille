import { Repository, DataSource } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { IUserRepository } from './user.repository.interface';

export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserEntity);
  }

  async findByAuth0Id(auth0Id: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { auth0Id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email } });
  }

  async save(user: Partial<UserEntity>): Promise<UserEntity> {
    const userEntity = this.repository.create(user);
    return this.repository.save(userEntity);
  }

  async update(id: number, user: Partial<UserEntity>): Promise<UserEntity> {
    await this.repository.update(id, user);
    const updatedUser = await this.repository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return updatedUser;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
