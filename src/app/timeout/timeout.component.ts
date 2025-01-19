import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { TrackerComponent } from "../tracker/tracker.component";
import { SocketService } from "../services/SocketService";
import { ActivatedRoute } from "@angular/router";
import { Config } from "../shared/config";
import { trigger, transition, style, animate } from "@angular/animations";

@Component({
  selector: "app-timeout",
  templateUrl: "./timeout.component.html",
  styleUrls: ["./timeout.component.scss"],
  animations: [
    trigger("fade", [
      transition(":enter", [style({ opacity: "0" }), animate("0.3s", style({ opacity: "1" }))]),

      transition(":leave", animate("0.3s", style({ opacity: "0" }))),
    ]),
  ],
})
export class TimeoutComponent implements OnInit, AfterViewInit {
  @ViewChild(TrackerComponent) trackerComponent!: TrackerComponent;
  groupCode = "UNKNOWN";
  socketService!: SocketService;
  match: any;
  timeout: any;
  team!: string;
  tournamentBackgroundUrl!: string;
  timeLeft!: number;
  interval: any;
  completed: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private config: Config,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.groupCode = params["groupCode"]?.toUpperCase() || "UNKNOWN";
      this.team = params["team"] || "";
      console.log(`Requested group code is ${this.groupCode}`);
    });
  }
  ngOnInit(): void {
    this.match = {
      groupCode: "A",
      isRanked: false,
      isRunning: true,
      roundNumber: 0,
      roundPhase: "combat",
      teams: [
        {
          isAttacking: true,
          teamName: "Team Name",
          teamTricode: "TEAM",
          teamUrl: "assets/misc/icon.webp",
          roundsWon: 0,
          spentThisRound: 1000,
          players: [],
        },
        {
          isAttacking: false,
          teamName: "Team Name",
          teamTricode: "TEAM",
          teamUrl: "assets/misc/icon.webp",
          roundsWon: 0,
          spentThisRound: 1000,
          players: [],
        },
      ],
      spikeState: { planted: false },
      map: "Ascent",
      tools: {
        timeout: {
          team: "tech",
          time: 30,
          maxtimeout: 2,
          teamLeft: 0,
          teamRight: 0,
        },
      },
    };
    this.timeout = this.match.tools.timeout;
    this.socketService = SocketService.getInstance(this.config.serverEndpoint, this.groupCode);
    this.tournamentBackgroundUrl =
      this.match?.tournamentBackgroundUrl && this.match.tournamentBackgroundUrl !== ""
        ? this.match.tournamentBackgroundUrl
        : "../../assets/misc/endround-bg.webp";
    this.preloadImage(this.tournamentBackgroundUrl);
  }
  ngAfterViewInit(): void {
    this.match.tools.timeout.team = this.team;
    this.timeLeft = this.match.tools.timeout.time;
    this.socketService.subscribe((data: any) => {
      this.updateTimeout(data);
    });
    this.startTimer();
  }
  public updateTimeout(data: any) {
    delete data.eventNumber;
    delete data.replayLog;
    this.match = data;
    this.timeout = this.match.tools.timeout;
  }
  startTimer() {
    this.interval = setInterval(() => {
      if(this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.completed = true;
      }
    }, 1000);
  }
  private preloadImage(url: string): void {
    const img = new Image();
    img.src = url;
  }
  convertInt(value: string): number {
    return parseInt(value, 10);
  }
  setTournamentBackgroundImage(): string {
    return `url(${this.tournamentBackgroundUrl})`;
  }
  getProgressWidth(): string {
    return `${(this.timeLeft / 30) * 100}%`;
  }
  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
