import os
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker, scoped_session


engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))


def main():

    # create tables
    db.execute(text("""CREATE TABLE Records (
                        user_id VARCHAR NOT NULL,
                        vehicle_type VARCHAR NOT NULL,
                        ride_type VARCHAR NOT NULL,
                        start_time TIMESTAMP NOT NULL,
                        end_time TIMESTAMP NOT NULL);"""))
    db.execute(text("""CREATE TABLE users (
                        user_id VARCHAR PRIMARY KEY,
                        password VARCHAR NOT NULL,
                        user_name VARCHAR NOT NULL);"""))
    db.commit()


if __name__ == "__main__":
    main()
    print("The tables are created successfully.")