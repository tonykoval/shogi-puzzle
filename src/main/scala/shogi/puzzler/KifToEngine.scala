package shogi.puzzler

import cats.data.Validated.{Invalid, Valid}
import shogi.{Color, Replay}
import shogi.format.Reader.Result.{Complete, Incomplete}
import shogi.format.forsyth.Sfen
import shogi.format.kif.KifParser
import shogi.format.usi.Usi
import shogi.format.{ParsedNotation, Reader, Tag}

import java.io.PrintWriter
import scala.io.Source

object KifToEngine extends App {
  val parser = KifParser.full _

  val games: Seq[String] = for (kifFilename <- getListOfFiles("patrick")) yield {
    println(kifFilename)
    parser(Source.fromFile(kifFilename).mkString) map { parsedNotation: ParsedNotation =>

      val listSfen: Seq[(Vector[Usi], Sfen)] =
        (Reader.fromParsedNotation(parsedNotation, x => x) match {
          case Complete(replay) =>
            Replay.gamesWhileValid(replay.state.usiMoves, None, shogi.variant.Standard)._1.map(x => (x.usiMoves, x.toSfen))
          case Incomplete(_, failures) => throw new Exception(failures)
        }).toList

      val id = kifFilename.replaceAll("kif\\\\", "")
      val sente = parsedNotation.tags.value.find(_.name == Tag.Sente).map(_.value)
      val gote = parsedNotation.tags.value.find(_.name == Tag.Gote).map(_.value)
      val player: Color = findMe(sente, gote, player="conquerror99").getOrElse(throw new Exception("player not found"))

      id.replaceAll("[^a-zA-Z0-9._]+", "") + ";" + player.name.toLowerCase + ";" + listSfen.last._1.map(x => x.usi).mkString(" ")
    } match {
      case Valid(a) => a
      case Invalid(e) => throw new Exception(e)
    }
  }

  new PrintWriter("generator/data/patrick-games.txt") {
    write(games.mkString("\n"))
    close()
  }
}
