import { Component, OnInit }    from '@angular/core'
import { Player }               from '../models/player'
import { Training }             from '../models/training'
import { Comment }              from '../models/comment'
import { ApiService }           from '../api.service'

@Component({
  templateUrl: './training.section.component.html'
})
export class TrainingSectionComponent implements OnInit {

    selectedTraining : Training;
    selectedPlayer : Player;

    commentName : string;
    commentMessage : string;

    comments : Comment[];

    allPlayers : Player[] = [];
    trainings : Training[] = [];

    attending : Player[] = [];
    notAttending : Player[] = [];
    notAnswered : Player[] = [];

    constructor(
        private apiService : ApiService
    ){
    }

    ngOnInit() : void {
        let p1 = this.apiService.getPlayers().then(allPlayers => {
            this.allPlayers = allPlayers;
        });
        let p2 = this.apiService.getTrainings().then(trainings => {
            this.trainings = trainings;
            this.selectedTraining = trainings[0];
        });
        Promise.all([p1, p2]).then(() => {
            this.salmonAndTuna();
        });
    }

    register() {
        this.apiService.register(this.selectedTraining, this.selectedPlayer, "1").then(r => this.salmon());
    }

    registerDisabled() {
        return !this.selectedPlayer || this.attending.some(p => p.id === this.selectedPlayer.id);
    }

    unregister() {
        this.apiService.register(this.selectedTraining, this.selectedPlayer, "0").then(r => this.salmon());
    }

    unregisterDisabled() {
        return !this.selectedPlayer || this.notAttending.some(p => p.id === this.selectedPlayer.id);
    }

    addComment() {
        this.apiService.createMessage(this.selectedTraining, this.commentName, this.commentMessage).then(result => {
            if (result == true) {
                this.commentName = "";
                this.commentMessage = "";
                this.tuna();
            } else {
                // todo: handle error
            }
        });
    }

    commentDisabled() {
        return !this.commentName || !this.commentMessage;
    }

    salmonAndTuna() {
        this.salmon();
        this.tuna();
    }

    tuna() {
        this.apiService.getMessages(this.selectedTraining).then(result => {
            this.comments = result;
        });
    }

    private salmon() {
        this.apiService.getTrainingRegistrations(this.selectedTraining).then(result => {
            this.attending = [];
            this.notAttending = [];
            this.notAnswered = [];

            for (var i = 0; i < this.allPlayers.length; i++) {
                let player = this.allPlayers[i];

                let response = result.find(tr => tr.name === player.id)

                if (!response) {
                    this.notAnswered.push(player);
                } else if (response.status === "1") {
                    this.attending.push(player);
                } else if (response.status === "0") {
                    this.notAttending.push(player);
                }
            }

            var attendingGuests = result.filter(r => r.guest != null && r.status === "1");
            for (var i = 0; i < attendingGuests.length; i++) {
                var g = attendingGuests[i];
                var guestPlayer = new Player();
                guestPlayer.id = "-1";
                guestPlayer.username = "Gäst: " + g.guest + " (" + this.allPlayers.find(p => p.id === g.name).username + ")";
                this.attending.push(guestPlayer);
            }
        });
    }
}
