import os
import pandas as pd
import random
import string
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker, scoped_session


engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))


def add_token(user_id):
    """
    import user_id, token into the Token table
    :param user_id
    :return token
    """
    token = generate_random_token(user_id)
    db.execute(text("""INSERT INTO Tokens (user_id, token)
                        VALUES(:user_id, :token)"""),
               {"user_id": user_id, "token": token})
    db.commit()
    return token


def add_user(new_id, new_name, new_password):
    """
    Import new user to the User database
    Check if the user already exists first
    :param new_id
    :param new_name
    :param new_password
    """

    # check if the user id exist in our database
    duplicate = db.execute(text("SELECT * FROM users WHERE user_id = :new_id"), {"new_id": new_id}).fetchone()

    if duplicate is None:
        db.execute(text("""INSERT INTO Users (user_id, user_name, password)
                           VALUES(:user_id, :user_name, :password)"""),
                   {"user_id": new_id, "user_name": new_name, "password": new_password})
        db.commit()

        return True

    else:
        return False


def generate_random_token(user_id):
    """
    Generate a 16-byte random token for the user
    and store it in the tokens database
    :param: user_id
    :return: token
    """
    while True:
        # generate the random api string
        letters = string.ascii_letters + string.digits
        random_str = ''.join(random.choices(letters, k=16))

        # check if the api string already existed
        check = db.execute(text("""SELECT * FROM Tokens
                                    WHERE token=:token"""),
                           {"token": random_str}).fetchall()
        if len(check) == 0:
            break

    return random_str


def main():

    data = pd.read_csv("books.csv", header=0)
    print(data)

    # write all data to records table
    for i in range(0, data.shape[0]):
        db.execute(text("""INSERT INTO records (isbn, title, year, author_name)
                            VALUES(:isbn, :title, :year, :name)"""),
                   {"isbn":data.loc[i, "isbn"], "title":data.loc[i,"title"], "year":int(data.loc[i, "year"]),
                    "name":data.loc[i, "author"]})

    # write authors information into authors table
    authors = db.execute(text("SELECT DISTINCT(author_name) FROM records")).fetchall()
    for author in authors:
        db.execute(text("""INSERT INTO authors (name) VALUES(:name)"""),{"name":author[0]})

    # write books information into books table
    for i in range(0, data.shape[0]):
        # relationship between author name and id
        author_id = db.execute(text("SELECT id FROM authors WHERE name=:name"), {"name":data.loc[i, "author"]}).fetchone()

        db.execute(text("""INSERT INTO books (isbn, title, year, author_id)
                            VALUES(:isbn, :title, :year, :author_id)"""),
                   {"isbn":data.loc[i, "isbn"], "title":data.loc[i,"title"], "year":int(data.loc[i, "year"]),
                    "author_id":author_id[0]})

    # write a user into users table
    db.execute(text("""INSERT INTO users (user_id, password)
                        VALUES(:id, :password)"""),
               {"id": "Roy", "password":"1111"})

    db.commit()


if __name__ == "__main__":
    main()