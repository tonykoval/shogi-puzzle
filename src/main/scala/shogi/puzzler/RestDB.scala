package shogi.puzzler

import io.circe.parser.parse

import java.net.{HttpURLConnection, URL}
import scala.io.Source
import io.circe.generic.auto._
import io.circe.syntax._

object RestDB {

  case class Review(`_id`: String, id: String, comment: String, feedback: String, timestamp: Long)

  def getFeedbacks(): Seq[Review] = {
    val finalUrl = new URL("https://shogipuzzle-cafe.restdb.io/rest/feedback");
    val connection: HttpURLConnection = finalUrl.openConnection().asInstanceOf[HttpURLConnection]
    connection.setRequestMethod("GET");
    connection.setRequestProperty("X-apikey", "63b58ffb969f06502871a92e");
    connection.setRequestProperty("Content-Type", "application/json");
    connection.setConnectTimeout(60000);
    connection.setUseCaches(false);
    connection.setDoOutput(true);

    val content = Source.fromInputStream(connection.getInputStream).mkString

    val json = parse(content).getOrElse(throw new Exception("invalid json"))
    json.as[List[Review]] match {
      case Left(error) =>
        throw new Exception(s"invalid json: $error")
      case Right(reviews) =>
        reviews
    }
  }
}
