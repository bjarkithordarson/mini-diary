import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import is from 'electron-is';

import Overlay from '../Overlay';
import Banner from '../../../elements/Banner';
import { getDiaryFilePath, FILE_NAME } from '../../../../helpers/diaryFile';
import { moveFile } from '../../../../helpers/fileAccess';
import { translations } from '../../../../helpers/i18n';
import { isAtLeastMojave } from '../../../../helpers/os';
import { saveDirPref } from '../../../../helpers/preferences';

const { dialog } = require('electron').remote;

const propTypes = {
	isLocked: PropTypes.bool.isRequired,
	setPreferencesVisibility: PropTypes.func.isRequired,
	testFileExists: PropTypes.func.isRequired,
	themePref: PropTypes.oneOf(['auto', 'light', 'dark']).isRequired,
	updatePassword: PropTypes.func.isRequired,
	updateThemePref: PropTypes.func.isRequired
};

export default class Preferences extends PureComponent {
	constructor() {
		super();

		this.state = {
			fileDir: getDiaryFilePath(),
			password1: '',
			password2: ''
		};

		// Function bindings
		this.onChangePassword1 = this.onChangePassword1.bind(this);
		this.onChangePassword2 = this.onChangePassword2.bind(this);
		this.hidePreferences = this.hidePreferences.bind(this);
		this.selectDir = this.selectDir.bind(this);
		this.selectMoveDir = this.selectMoveDir.bind(this);
		this.setThemePrefAuto = this.setThemePrefAuto.bind(this);
		this.setThemePrefDark = this.setThemePrefDark.bind(this);
		this.setThemePrefLight = this.setThemePrefLight.bind(this);
		this.updateDir = this.updateDir.bind(this);
		this.updatePassword = this.updatePassword.bind(this);
	}

	onChangePassword1(e) {
		const password1 = e.target.value;

		this.setState({
			password1
		});
	}

	onChangePassword2(e) {
		const password2 = e.target.value;

		this.setState({
			password2
		});
	}

	setThemePrefAuto() {
		const { updateThemePref } = this.props;

		updateThemePref('auto');
	}

	setThemePrefDark() {
		const { updateThemePref } = this.props;

		updateThemePref('dark');
	}

	setThemePrefLight() {
		const { updateThemePref } = this.props;

		updateThemePref('light');
	}

	selectDir() {
		const { testFileExists } = this.props;

		// Show dialog for selecting directory
		const fileDirArray = dialog.showOpenDialog({
			buttonLabel: translations['select-directory'],
			properties: ['openDirectory']
		});

		if (fileDirArray && fileDirArray.length === 1) {
			// Use mini-diary.txt file from selected directory
			const newDir = fileDirArray[0];
			this.updateDir(newDir);
			testFileExists();
		}
	}

	selectMoveDir() {
		const { fileDir } = this.state;

		// Show dialog for selecting directory
		const fileDirArray = dialog.showOpenDialog({
			buttonLabel: translations['move-file'],
			properties: ['openDirectory']
		});

		if (fileDirArray && fileDirArray.length === 1) {
			// Move mini-diary.txt file to selected directory
			const newDir = fileDirArray[0];
			try {
				moveFile(fileDir, `${newDir}/${FILE_NAME}`);
			} catch (err) {
				dialog.showErrorBox(
					translations['move-error-title'],
					`${translations['move-error-msg']}: ${err.message}`
				);
				return;
			}
			this.updateDir(newDir);
		}
	}

	updateDir(dir) {
		saveDirPref(dir);
		this.setState({
			fileDir: getDiaryFilePath()
		});
	}

	updatePassword() {
		const { updatePassword } = this.props;
		const { password1, password2 } = this.state;

		if (password1 === password2) {
			updatePassword(password1);
			this.setState({
				password1: '',
				password2: ''
			});
		} else {
			throw Error(translations['passwords-no-match']);
		}
	}

	hidePreferences() {
		const { setPreferencesVisibility } = this.props;

		setPreferencesVisibility(false);
	}

	render() {
		const { isLocked, themePref } = this.props;
		const { fileDir, password1, password2 } = this.state;

		const passwordsMatch = password1 === password2;

		return (
			<Overlay onClose={this.hidePreferences}>
				<h1>{translations.preferences}</h1>
				<form className="preferences-form">
					{/* Theme */}
					<fieldset className="fieldset-theme">
						<legend>{translations.theme}</legend>
						<div className="fieldset-content">
							{is.macOS() && isAtLeastMojave() && (
								<label htmlFor="radio-theme-auto">
									<input
										type="radio"
										name="radio-theme-auto"
										id="radio-theme-auto"
										className="radio"
										checked={themePref === 'auto'}
										onChange={this.setThemePrefAuto}
									/>
									{translations.auto}
								</label>
							)}
							<label htmlFor="radio-theme-light">
								<input
									type="radio"
									name="radio-theme-light"
									id="radio-theme-light"
									className="radio"
									checked={themePref === 'light'}
									onChange={this.setThemePrefLight}
								/>
								{translations.light}
							</label>
							<label htmlFor="radio-theme-dark">
								<input
									type="radio"
									name="radio-theme-dark"
									id="radio-theme-dark"
									className="radio"
									checked={themePref === 'dark'}
									onChange={this.setThemePrefDark}
								/>
								{translations.dark}
							</label>
						</div>
					</fieldset>
					{/*
							File directory
							When locked: Change directory
							When unlocked: Move diary file and change directory
							Not accessible in MAS build due to sandboxing (would not be able to reopen the diary
							file without an open dialog after changing the diary path)
						 */
					!is.mas() && (
						<fieldset className="fieldset-file-dir">
							<legend>{translations['diary-file']}</legend>
							<div className="fieldset-content">
								<p>{fileDir}</p>
								<button
									type="button"
									className="button button-main"
									onClick={isLocked ? this.selectDir : this.selectMoveDir}
								>
									{isLocked ? translations['change-directory'] : translations['move-file']}
								</button>
							</div>
						</fieldset>
					)}
					{/* Password (only when unlocked) */
					!isLocked && (
						<fieldset className="fieldset-password">
							<legend>{translations.password}</legend>
							<div className="fieldset-content">
								<input
									type="password"
									value={password1}
									placeholder={translations['new-password']}
									required
									onChange={this.onChangePassword1}
								/>
								<input
									type="password"
									value={password2}
									placeholder={translations['repeat-new-password']}
									required
									onChange={this.onChangePassword2}
								/>
								<button
									type="button"
									disabled={!password1 || !password2 || !passwordsMatch}
									onClick={this.updatePassword}
									className="button button-main"
								>
									{translations['change-password']}
								</button>
							</div>
							<div className="password-update-banner">
								{password1 && password2 && !passwordsMatch && (
									<Banner type="error" message={translations['passwords-no-match']} />
								)}
							</div>
						</fieldset>
					)}
				</form>
			</Overlay>
		);
	}
}

Preferences.propTypes = propTypes;
