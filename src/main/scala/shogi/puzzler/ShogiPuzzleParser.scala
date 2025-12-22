package shogi.puzzler

import cats.data.Validated.Valid
import io.circe.generic.auto._
import io.circe.parser.parse
import io.circe.syntax._
import shogi.Color
import shogi.format.kif.KifParser
import shogi.format.usi.Usi
import shogi.format.{ParsedNotation, Tag}

import java.io.PrintWriter
import scala.io.Source

import RestDB._

object ShogiPuzzleParser extends App {

  case class Kif(
                  id: String,
                  sente: Option[String],
                  gote: Option[String],
                  timeControl: Option[String],
                  site: Option[String],
                  date: Option[String]
                )

  val parser = KifParser.full _

  val kifs: Seq[Kif] = for (kifFilename <- getListOfFiles("patrick")) yield {
    parser(Source.fromFile(kifFilename).mkString) map { parsedNotation: ParsedNotation =>

      val sente = parsedNotation.tags.value.find(_.name == Tag.Sente).map(_.value)
      val gote = parsedNotation.tags.value.find(_.name == Tag.Gote).map(_.value)
      val timeControl = parsedNotation.tags.value.find(_.name == Tag.TimeControl).map(_.value)
      val site = parsedNotation.tags.value.find(_.name == Tag.Site).map(_.value)
      val date = parsedNotation.tags.value.find(_.name == Tag.Start).map(_.value)
      Kif(
        kifFilename.replaceAll("kif\\\\", "").replaceAll("[^a-zA-Z0-9._]+", ""),
        sente,
        gote,
        timeControl,
        site,
        date
      )
    } match {
      case Valid(a) => a
    }
  }

  case class EngineMove(
                         score: Score,
                         usi: String
                       )

  case class Puzzle(
                     id: String,
                     sfen: String,
                     your_move_usi: String,
                     opponent_last_move_usi: String,
                     player: String,
                     score: Score,
                     prev_score: Score,
                     best: EngineMove,
                     second: Option[EngineMove] = None,
                     third: Option[EngineMove] = None,
                     opponent_last_move_usi_positions: Option[Seq[String]] = None,
                     your_move: Option[WrapPiece] = None,
                     best_move: Option[WrapPiece] = None,
                     second_move: Option[WrapPiece] = None,
                     third_move: Option[WrapPiece] = None,
                     hands: Option[String] = None,
                     comment: Option[String] = None,
                     sente: Option[String] = None,
                     gote: Option[String] = None,
                     timeControl: Option[String] = None,
                     site: Option[String] = None,
                     date: Option[String] = None
                   )

  val puzzleJson = parse(Source.fromFile("generator/data/patrick-puzzles.json").mkString).getOrElse(throw new Exception("invalid json"))
  puzzleJson.as[List[Puzzle]] match {
    case Left(error) =>
      throw new Exception(s"invalid json: $error")
    case Right(puzzles: List[Puzzle]) =>

      val newPuzzles: Seq[Puzzle] = puzzles.map { puzzle =>
        val kif: Option[Kif] = kifs.find(x => x.id == puzzle.id)
        val splits = puzzle.sfen.split(" ")
        val comment = s"Blunder [${getMove(puzzle.your_move_usi, puzzle.sfen).getOrElse("")}, score: (${getScore(puzzle.prev_score).getOrElse("")} → ${getScore(puzzle.score).getOrElse("")})] \n" +
          s"Best [${getMove(puzzle.best.usi, puzzle.sfen).getOrElse("")}, score: (${getScore(puzzle.prev_score).getOrElse("")} → ${getScore(puzzle.best.score).getOrElse("")})] \n" +
          puzzle.second.map(x => s"Second [${getMove(x.usi, puzzle.sfen).getOrElse("")}, score: (${getScore(puzzle.prev_score).getOrElse("")} → ${getScore(x.score).getOrElse("")})] \n").getOrElse("") +
          puzzle.third.map(x => s"Third [${getMove(x.usi, puzzle.sfen).getOrElse("")}, score: (${getScore(puzzle.prev_score).getOrElse("")} → ${getScore(x.score).getOrElse("")})]\n").getOrElse("")

        puzzle.copy(
          id = puzzle.id + "#" + splits(3),
          opponent_last_move_usi_positions = Some(Usi.apply(puzzle.opponent_last_move_usi).get.positions.map(_.key)),
          your_move = Some(getPiece(puzzle.your_move_usi, Color(splits(1)(0)).get, None, Some(puzzle.score)).get),
          best_move = Some(getPiece(puzzle.best.usi, Color(splits(1)(0)).get, Some(1), Some(puzzle.best.score)).get),
          second_move = puzzle.second.flatMap(x => Some(getPiece(x.usi, Color(splits(1)(0)).get, Some(2), Some(x.score)).get)),
          third_move = puzzle.third.flatMap(x => Some(getPiece(x.usi, Color(splits(1)(0)).get, Some(3), Some(x.score)).get)),
          hands = Some(splits(2)),
          comment = Some(comment),
          sente = kif.flatMap(_.sente),
          gote = kif.flatMap(_.gote),
          timeControl = kif.flatMap(_.timeControl),
          site = kif.flatMap(_.site),
          date = kif.flatMap(_.date)
        )
      }

//      val feedbacks: Seq[Review] = RestDB.getFeedbacks()

      new PrintWriter("docs/data/patrick-puzzles.json") {
        write(newPuzzles.asJson.spaces2)
        close()
      }

      println(s"number of puzzles: ${newPuzzles.size}")
  }

}
