import skin from './skin';
import beastAudioFile from '../../assets/sounds/AncientBeast.ogg';

// Global declarations
declare global {
	interface Window {
		game: any;
	}
}

export class MusicPlayer {
	audio: any;
	playlist: HTMLElement | null;
	tracks: NodeListOf<HTMLElement>;
	repeat: boolean;
	beastAudio: HTMLAudioElement;

	constructor() {
		this.audio = skin;
		this.playlist = document.querySelector('#playlist') as HTMLElement;
		this.tracks = document.querySelectorAll('#playlist li.epic') as NodeListOf<HTMLElement>;

		this.repeat = true;

		this.audio.volume = 0.25;
		this.audio.pause();

		this.beastAudio = new Audio(beastAudioFile);

		const genreEpic = document.getElementById('genre-epic');
		if (genreEpic) {
			genreEpic.classList.add('active-text');
		}
		
		if (this.playlist) {
			const allTracks = this.playlist.querySelectorAll('li');
			allTracks.forEach(track => {
				if (!track.classList.contains('epic')) {
					track.classList.add('hidden');
				}
			});
		}

		// Debug genre selection
		const musicGenresTitles = document.querySelectorAll('.musicgenres__title');
		musicGenresTitles.forEach(genreTitle => {
			genreTitle.addEventListener('click', this.handleGenreClick.bind(this));
		});

		// Debug playlist track selection
		if (this.playlist) {
			const playlistTracks = this.playlist.querySelectorAll('li');
			playlistTracks.forEach(track => {
				track.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.run(e.currentTarget as HTMLElement);
				});
			});
		}

		this.audio.addEventListener('ended', () => {
			// Check if tracks list exists, and if it does, play random track, else stop playback
			if (this.tracks && this.tracks.length > 0) {
				this.playRandom();
			} else {
				this.stopMusic();
			}
		});

		const beastPlayer = document.querySelector('.audio-player-beast');
		if (beastPlayer) {
			beastPlayer.addEventListener('click', (e) => {
				e.stopPropagation();
				// Perform on beast click
				this.beastAudio.play();
			});
		}

		// Volume sliders requested
		const volSlider = document.getElementById('vol') as HTMLInputElement;
		if (volSlider) {
			volSlider.addEventListener('change', (e) => {
				this.audio.volume = Number((e.target as HTMLInputElement).value);
			});
		}

		const sfxSlider = document.getElementById('sfx') as HTMLInputElement;
		if (sfxSlider) {
			sfxSlider.addEventListener('change', (e) => {
				if (window.game && window.game.soundsys) {
					window.game.soundsys.allEffectsMultiplier = Number((e.target as HTMLInputElement).value);
				}
			});
		}
	}

	handleGenreClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		const clickedGenre = e.target as HTMLElement;
		clickedGenre.classList.toggle('active-text');

		if (!clickedGenre.classList.contains('active-text')) {
			// The inner text is capitalized but the class name is not (e.g Epic vs epic).
			// We must use toLowerCase so that it works correctly.
			const clickedGenreClass = clickedGenre.innerText.toLowerCase();
			if (this.playlist) {
				const unusedTracks = this.playlist.querySelectorAll(`li.${clickedGenreClass}`);
				unusedTracks.forEach(track => track.classList.add('hidden'));
			}
		}

		const parent = clickedGenre.parentElement;
		if (parent) {
			const activeGenres = parent.querySelectorAll('.active-text');
			const allGenres = parent.querySelectorAll('.musicgenres__title');

			const activeGenresSelectors = Array.from(
				activeGenres.length === 0 ? allGenres : activeGenres
			).map((genreNode: Element) => `li.${genreNode.textContent?.toLowerCase() || ''}`);

			const allGenresSelectors = Array.from(allGenres).map(
				(genreNode: Element) => `li.${genreNode.textContent?.toLowerCase() || ''}`
			);

			if (this.playlist) {
				// First hide all tracks
				const allTracks = this.playlist.querySelectorAll(allGenresSelectors.join(', '));
				allTracks.forEach(track => track.classList.add('hidden'));

				// Then show active tracks
				const activeTracks = this.playlist.querySelectorAll(activeGenresSelectors.join(', '));
				activeTracks.forEach(track => track.classList.remove('hidden'));
			}
		}
	}

	getCurrentTrackIndex(): number {
		return Array.from(this.tracks).findIndex(track =>
			track.classList.contains('active-text')
		);
	}

	playRandom() {
		const currentTrackIndex = this.getCurrentTrackIndex();
		// Check if any genre is active
		const musicGenresItems = document.querySelector('.musicgenres__items');
		const genreExists = musicGenresItems && 
			musicGenresItems.querySelector('.active-text') !== null;
			
		// If a genre is active, get a random track and play it, else stop audio
		if (genreExists) {
			let rand: number;

			do {
				rand = Math.floor(Math.random() * this.tracks.length);
			} while (rand === currentTrackIndex && this.tracks.length > 1); // Don't play the same track twice in a row

			const track = this.tracks[rand];
			this.run(track);
		} else {
			this.stopMusic();
		}
	}

	playNext() {
		const currentTrackIndex = this.getCurrentTrackIndex();
		const nextTrackIndex = currentTrackIndex + 1;
		const isNextTrackExists = this.tracks[nextTrackIndex];
		const shouldRepeat = !isNextTrackExists && this.repeat;

		const track = shouldRepeat ? this.tracks[0] : this.tracks[nextTrackIndex];
		if (track) {
			this.run(track);
		}
	}

	run(track: HTMLElement) {
		// Style the active track in the playlist
		const link = track.querySelector('a') as HTMLAnchorElement;
		if (!link) return;

		track.classList.add('active-text');
		// Remove active-text from siblings
		const parent = track.parentElement;
		if (parent) {
			const siblings = parent.querySelectorAll('li');
			siblings.forEach(sibling => {
				if (sibling !== track) {
					sibling.classList.remove('active-text');
				}
			});
		}

		this.audio.src = link.href;
		this.audio.load();

		// Debug play button state
		const playBtn = document.querySelector('.controls .toggle-play');
		if (playBtn) {
			playBtn.classList.remove('play');
			playBtn.classList.add('pause');
		}

		// Play audio
		this.audio.play().catch((error: Error) => {
			console.error('Error playing audio:', error);
		});
	}

	stopMusic() {
		this.audio.pause();
	}
}
