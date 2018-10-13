import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import TextareaAutosize from 'react-autosize-textarea';

import { getFilePath } from '../../helpers/preferences';


const propTypes = {
	date: PropTypes.instanceOf(Date).isRequired,
	encryptFile: PropTypes.func.isRequired,
	entries: PropTypes.objectOf(PropTypes.shape({
		dateUpdated: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		title: PropTypes.string.isRequired
	})).isRequired,
	hashedPassword: PropTypes.string.isRequired
};

export default class Editor extends Component {
	static formatDate(date) {
		return moment(date).format('YYYY-MM-DD');
	}

	static onTitleEnterKey(e) {
		// On typing "enter" in the title textarea, do not insert a newline character and jump to
		// the next form element
		if (e.which === 13) {
			e.preventDefault();
			e.target.nextElementSibling.focus();
		}
	}

	static getDerivedStateFromProps(props, state) {
		const { date: dateProps, entries } = props;
		const { date: dateState } = state;
		if (dateProps === dateState) {
			return null;
		}
		const dateFormatted = Editor.formatDate(dateProps);
		let text = '';
		let title = '';
		if (entries[dateFormatted]) {
			({ text, title } = entries[dateFormatted]);
		}
		return {
			date: dateProps,
			text,
			title
		};
	}

	constructor(props) {
		super(props);

		const { date, entries } = props;
		const dateFormatted = Editor.formatDate(date);
		let text = '';
		let title = '';
		if (entries[dateFormatted]) {
			({ text, title } = entries[dateFormatted]);
		}
		this.state = {
			date,
			text,
			title
		};

		// Function bindings
		this.onTextChange = this.onTextChange.bind(this);
		this.onTitleChange = this.onTitleChange.bind(this);
		this.saveEntry = this.saveEntry.bind(this);
	}

	onTextChange(e) {
		const text = e.target.value;
		this.setState({
			text
		});
	}

	onTitleChange(e) {
		const title = e.target.value;
		this.setState({
			title
		});
	}

	saveEntry() {
		const { date, encryptFile, entries, hashedPassword } = this.props;
		const { text, title } = this.state;
		const dateFormatted = Editor.formatDate(date);
		const filePath = getFilePath();

		if (title === '' && text === '') {
			// Empty entry: Delete entry from file if it exists
			if (dateFormatted in entries) {
				const entriesUpdated = entries;
				delete entriesUpdated[dateFormatted];
				encryptFile(filePath, hashedPassword, entriesUpdated);
			}
		} else if (
			!(dateFormatted in entries)
			|| text !== entries[dateFormatted].text
			|| title !== entries[dateFormatted].title
		) {
			// Non-empty and changed/missing entry: Write to file
			const entriesUpdated = {
				...entries,
				[dateFormatted]: {
					dateUpdated: new Date().toString(),
					text,
					title
				}
			};
			encryptFile(filePath, hashedPassword, entriesUpdated);
		}
	}

	render() {
		const { date, text, title } = this.state;
		const dateFormatted = moment(date).format('dddd, D MMMM YYYY');

		// TODO save input when quitting app
		return (
			<form className="editor">
				<p className="text-faded">{dateFormatted}</p>
				<TextareaAutosize
					className="editor-title"
					value={title}
					onChange={this.onTitleChange}
					onBlur={this.saveEntry}
					onKeyPress={Editor.onTitleEnterKey}
					placeholder="Add a title"
				/>
				<TextareaAutosize
					className="editor-text"
					value={text}
					onChange={this.onTextChange}
					onBlur={this.saveEntry}
					placeholder="Write something..."
				/>
			</form>
		);
	}
}

Editor.propTypes = propTypes;