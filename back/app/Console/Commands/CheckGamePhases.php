<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Game;
use App\Events\GamePhaseChanged;
use Carbon\Carbon;

class CheckGamePhases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:check-phases';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update game phases automatically';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking game phases...');

        // Obtener todas las partidas en progreso
        $games = Game::where('status', 'in_progress')
            ->whereNotNull('phase_started_at')
            ->get();

        foreach ($games as $game) {
            $phaseDuration = $game->current_phase === 'night' ? 120 : 180; // 2 min noche, 3 min día
            $startedAt = Carbon::parse($game->phase_started_at);
            $elapsed = now()->diffInSeconds($startedAt);

            // Si el tiempo de la fase ha expirado
            if ($elapsed >= $phaseDuration) {
                // Cambiar de fase
                $newPhase = $game->current_phase === 'day' ? 'night' : 'day';
                $newRound = $game->current_round;

                // Si vuelve a ser día, incrementar ronda
                if ($newPhase === 'day') {
                    $newRound++;
                }

                $game->current_phase = $newPhase;
                $game->current_round = $newRound;
                $game->phase_started_at = now();
                $game->save();

                // Duración de la nueva fase
                $newPhaseDuration = $newPhase === 'day' ? 180 : 120;

                // Notificar a todos los jugadores
                broadcast(new GamePhaseChanged($game->id, [
                    'phase' => $newPhase,
                    'round' => $newRound,
                    'time_remaining' => $newPhaseDuration,
                    'started_at' => now()->toIso8601String()
                ]))->toOthers();

                $this->info("Game {$game->id}: Changed to {$newPhase}, round {$newRound}");
            }
        }

        $this->info('Phase check completed!');
        return 0;
    }
}
