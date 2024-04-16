import os
import requests
from Import import *
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker, scoped_session
from flask import Flask, render_template, request, session, redirect, jsonify
from flask_session import Session
from user import *
import pandas as pd


users = []
users.append(User(user_id="Roy", password="1111"))

engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# store the user's information
user_id = []


# login page
@app.route("/", methods=["GET", "POST"])
def sign_in():
    if request.method == "POST":
        user_id.append(request.form.get("user_id"))
        password = request.form.get("user_password")

        user = db.execute(text("""SELECT * FROM users WHERE user_id = :user_id"""), {"user_id": user_id[0]}).fetchone()

        if user and user.password == password:
            session['user_id'] = user.user_id
            return redirect("/map")
        return render_template("signIn.html", message="wrong id or password")
    return render_template("signIn.html")


# register new account page
@app.route("/register/")
def register():
    return render_template("register.html")


# register succeed page
@app.route("/register/result/", methods=["POST"])
def register_result():

    new_id = request.form.get("user_id")
    new_password = request.form.get("user_password")
    new_username = request.form.get("user_name")

    if add_user(new_id, new_username, new_password):
        return render_template("registerResult.html")
    else:
        return render_template("register.html", message="The account already exist")


# logout page
@app.route("/logout/", methods=["POST", "GET"])
def logout():
    session.pop('user_id')
    user_id.clear()
    return redirect("/")


# map
@app.route("/map/")
def map_page():
    return render_template("index.html")


# user information api
@app.route("/api/user/")
def get_user_information():
    query_key, query_val = get_query_parameters()
    result = get_user_information(query_key, query_val)

    if result is None:
        return jsonify({"Error": "Invalid user"}), 404
    else:
        json_result = ({
            "user_id": result.user_id,
            "user_name": result.user_name,
            "user_password": result.password,
        })
        return jsonify(json_result)


# get access token for api
@app.route("/api/token/")
def get_token():
    query_key, query_val = get_query_parameters()
    user = get_user_information(query_key, query_val)

    user_id = request.args.get("user_id")

    if user is None:
        return jsonify({"Error": "Invalid user"}), 404
    else:
        token = add_token(user_id)
        return jsonify({
            "user_id": user_id,
            "token": token
        })


# get free scooter api
@app.route("/api/scooter/")
def get_free_scooter():
    query_key, query_val = get_query_parameters()

    if "access_token" not in query_key:
        return jsonify({
            "Error": "empty access token"
        })
    else:
        ind = query_key.index("access_token")

        # check if the token is valid
        token = query_val[ind]

        if is_valid_token(token):
            # check if the company is specified
            if "company" in query_key:
                c_index = query_key.index("company")
                company = query_val[c_index]

                if company == "neuron" or company == "Neuron":
                    data = fetch_scooter_data("neuron")

                elif company == "bird" or company == "Bird":
                    data = fetch_scooter_data("bird")

                else:
                    return jsonify({
                        "Error": "Invalid company"
                    })
            else:
                data = fetch_scooter_data("all")

            # check if the remaining battery is specified
            if "remaining_battery" in query_key:
                b_index = query_key.index("remaining_battery")
                battery = float(query_val[b_index])

                data = data[data['battery_pct'] > battery]

            # convert Dataframe to list on row level
            data_list = []
            for i in range(0, data.shape[0]):
                data_list.append(data.iloc[i, :].to_dict())

            return jsonify(data_list)
        else:
            return jsonify({
                "Error": "Invalid access token"
            })


def get_query_parameters():
    query = request.args                    # get the query parameters

    query_key = list(query.keys())
    query_val = list(query.values())

    return query_key, query_val


def get_user_information(query_key, query_val):
    sql_text = f"SELECT * FROM users" + \
               f" WHERE {query_key[0]}='{query_val[0]}'" + \
               f" AND {query_key[1]}='{query_val[1]}'"
    result = db.execute(text(sql_text)).fetchone()
    return result


def is_valid_token(token):
    """
    Check if the access token is valid
    :param token:
    :return: boolean
    """
    check = db.execute(text("""SELECT * FROM Tokens
                                WHERE token=:token"""),
                       {"token": token}).fetchone()
    if check is None:
        return False
    else:
        return True


def fetch_scooter_data(company):
    """
    Fetch the free scooter data from different companies
    Return in a DataFrame
    :param company: "neuron": only retrieve Neuron's data
                    "bird": only retrieve Bird's data
                    "all": retrieves both data
    :return:
    """
    bird_url = "https://raw.githubusercontent.com/chshxiao/" +\
               "Calgary-shared-bikes-escooter-map/master/bird_simulated_data.txt"
    neuron_url = "https://mds-global-yyc.neuron-mobility.com/gbfs/2/en/free_bike_status"

    if company == "bird":
        bird_r = requests.get(bird_url)
        bird_data_dict = bird_r.json()
        bird_data_dict = bird_data_dict["data"]["bikes"]

        # add company
        for i in range(0, len(bird_data_dict)):
            bird_data_dict[i]["company"] = "Bird"
        res = pd.DataFrame.from_dict(bird_data_dict)

    elif company == "neuron":
        neuron_r = requests.get(neuron_url)
        neuron_data_dict = neuron_r.json()
        neuron_data_dict = neuron_data_dict["data"]["bikes"]

        # add company
        for i in range(0, len(neuron_data_dict)):
            neuron_data_dict[i]["company"] = "Neuron"
        res = pd.DataFrame.from_dict(neuron_data_dict)

    else:
        # bird
        bird_r = requests.get(bird_url)
        bird_data_dict = bird_r.json()
        bird_data_dict = bird_data_dict["data"]["bikes"]

        # add company
        for i in range(0, len(bird_data_dict)):
            bird_data_dict[i]["company"] = "Bird"

        # neuron
        neuron_r = requests.get(neuron_url)
        neuron_data_dict = neuron_r.json()
        neuron_data_dict = neuron_data_dict["data"]["bikes"]

        # add company
        for i in range(0, len(neuron_data_dict)):
            neuron_data_dict[i]["company"] = "Neuron"

        # combine two database
        combined = bird_data_dict + neuron_data_dict

        res = pd.DataFrame.from_dict(combined)

    return res


# # book searching page
# @app.route("/book", methods=['GET', 'POST'])
# def main_page():
#     search_result = []
#
#     if request.method == "GET":
#         return render_template("mainpage.html", book=search_result)
#
#     else:
#         input_type = request.form.get("type")
#         input_value = "%" + request.form.get("value") + "%"
#
#         if input_type == "author":
#             search_result = db.execute(text("""SELECT * FROM books
#                                                     WHERE author_id IN
#                                                     (SELECT id FROM authors
#                                                     WHERE name LIKE :name)"""), {"name": input_value}).fetchall()
#         else:
#             search_result = db.execute(text("SELECT * FROM books "
#                                             "WHERE " + input_type + " LIKE :input_value"),
#                                        {"input_value": input_value}).fetchall()
#
#         if len(search_result) == 0:
#             return render_template("error.html", message="Nothing Match")
#         else:
#             return render_template("mainpage.html", books=search_result)
#
#
# # book detail page
# @app.route("/book/<string:isbn>/")
# def book_detail(isbn):
#     local_detail = db.execute(text("""SELECT b.isbn, b.title, au.name, b.year
#                                     FROM books AS b, authors AS au
#                                     WHERE b.isbn =:isbn
#                                     AND b.author_id = au.id"""),
#                               {"isbn": isbn}).fetchone()
#
#     reviews = db.execute(text("""SELECT b.isbn, r.review, r.user_id
#                                     FROM books AS b, reviews AS r
#                                     WHERE b.isbn = :isbn
#                                     AND r.isbn = b.isbn"""),
#                          {"isbn": isbn}).fetchall()
#
#     if len(local_detail) == 0:
#         return render_template("error.html", message="Cannot find the details of the book")
#     else:
#         # get the isbn and find the book from api
#         api_detail = extract_rating_from_api(isbn)
#
#         # get the real date
#         final_publish_date = coalesce_publish_date(local_detail.year, api_detail['publishedDate'])
#
#         return render_template("detail.html", detail=local_detail, reviews=reviews,
#                                api_detail=api_detail, published_date=final_publish_date)
#
#
# # book detail api page
# @app.route("/api/book/<string:isbn>/")
# def book_detail_api(isbn):
#     # validate the isbn
#     detail = db.execute(text("""SELECT b.isbn, b.title, au.name, b.year
#                                 FROM books AS b, authors AS au
#                                 WHERE b.isbn =:isbn AND b.author_id = au.id"""),
#                         {"isbn": isbn}).fetchone()
#
#     reviews = db.execute(text("""SELECT b.isbn, r.review
#                                     FROM books AS b, reviews AS r
#                                     WHERE b.isbn = :isbn
#                                     AND r.isbn = b.isbn"""),
#                          {"isbn": isbn}).fetchall()
#
#     if detail is None:
#         return jsonify({"Error": "Invalid ISBN"}), 404
#
#     # get the isbn and find the book from api
#     api_detail = extract_rating_from_api(isbn)
#     print(reviews)
#
#     return jsonify({
#         "title": detail.title,
#         "author": detail.name,
#         "publishedDate": api_detail["publishedDate"],
#         "ISBN10": api_detail["isbn10"],
#         "ISBN13": api_detail["isbn13"],
#         "averageRating": api_detail["averageRating"],
#         "reviewCount": len(reviews)
#     })
#
#
# # write a review
# @app.route("/book/<string:isbn>/writereview/")
# def write_review(isbn):
#     # check if the user have already written a review for the book
#     review_record = db.execute(text("""SELECT * FROM reviews
#                                         WHERE user_id = :user_id AND isbn = :isbn"""),
#                                {"user_id": user_id[0], "isbn": isbn}).fetchone()
#
#     print(review_record)
#
#     if review_record is not None:
#         return render_template("error.html", message="You have review on this book")
#
#     return render_template("writereview.html", isbn=isbn)
#
#
# # load the review
# @app.route("/reviewupload/<string:isbn>/", methods=['POST'])
# def upload_review(isbn):
#     # get the rating and the text review
#     rating = request.form.get('rating')
#     review = request.form.get('review')
#
#     print(isbn)
#
#     # insert the rating and review to reviews table in database
#     db.execute(text("""INSERT INTO reviews (user_id, isbn, review, rating)
#                         VALUES(:user_id, :isbn, :review, :rating)"""),
#                {"user_id": user_id[0], "isbn": isbn, "review": review, "rating": rating})
#     db.commit()
#
#     return render_template("review.html")


# def extract_rating_from_api(isbn):
#     # get the isbn and find the book from api
#     param_value = "isbn:" + isbn
#     api_detail_ls = requests.get("https://www.googleapis.com/books/v1/volumes", params={"q": param_value})
#
#     api_detail_js = api_detail_ls.json()
#     publish_date = api_detail_js["items"][0]["volumeInfo"]['publishedDate']  # published date
#     isbn_13 = api_detail_js["items"][0]["volumeInfo"]["industryIdentifiers"][0]["identifier"]
#     isbn_10 = api_detail_js["items"][0]["volumeInfo"]["industryIdentifiers"][1]["identifier"]
#
#     # average rating and review count might not be applicable to some books
#     if "averageRating" in api_detail_js["items"][0]["volumeInfo"].keys():
#         avg_rating = api_detail_js["items"][0]["volumeInfo"]["averageRating"]
#     else:
#         avg_rating = ""
#
#     # return a dictionary
#     res = {"isbn10": isbn_10, "isbn13": isbn_13, "publishedDate": publish_date, "averageRating": avg_rating}
#
#     return res
#
#
# def coalesce_publish_date(local_date, api_date):
#     if api_date == "":
#         return local_date
#     else:
#         return api_date
