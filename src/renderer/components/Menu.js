import React from 'react';
import styled from "styled-components"


import { FaDownload, FaStop } from 'react-icons/fa';
import { IoMdVolumeHigh, IoMdSettings } from 'react-icons/io';

const IconBadge = styled.div`
  background-color: #fff;

  border: 1px solid rgba(0,0,0,.12);
  border-radius: 50%;
  height: 64px;
  width: 64px;

  > svg {
    display: block;
    fill: #757575;
    width: 32px;
    height: 32px;
    // 1px from border (box-sizing: border-box)
    transform: translate(15px, 15px);
  }
`

const FaStop_resize = styled.div`
  svg {
    display: block;
    fill: #757575;
    width: 24px;
    height: 24px;
    // 1px from border (box-sizing: border-box)
    // remaining pixels besides width/height / 2 - border px
    transform: translate(19px, 19px);
}
`
const FaStop_small = () => (
  <FaStop_resize>
    <FaStop/>
  </FaStop_resize>
)

const ButtonIconText = styled.div`
  color: #000;
  font-family: 'Google Sans',sans-serif;
  font-weight: 500;
  line-height: 18px;
  margin-top: 8px;
  opacity: .54;
  text-decoration: none!important;
  text-transform: none;
  text-align: center;
`

const ActionButton = styled.button`
  // button reset/clear styles
  padding: 0;
  border: none;
  font: inherit;
  color: inherit;
  background-color: transparent;
  /* show a hand cursor on hover; some argue that we
  should keep the default arrow cursor for buttons */
  cursor: pointer;
  &:focus {
    outline: none;//!important;
  }

  width: 64px;
  margin: 0 8px;

  &:hover {
    > ${ButtonIconText} {color: #1a73e8;opacity: 1;}
    svg {
      fill: #1a73e8;
    }
  }
`

const CircleButton = ({icon: Icon, label, onClick}) => {
  return (
    <ActionButton role="button" type="button" onClick={onClick}>
      <IconBadge>
        <Icon/>
      </IconBadge>
      <ButtonIconText>
        {label}
      </ButtonIconText>
    </ActionButton>
    )
}

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: #f5f5f5;
  height: 120px;
  width: 100%;
  border-top: 1px solid #777;
`

const Menu = (props) => {
  const ButtonProps = [
    {icon: IoMdSettings, label: `Settings`},//, onClick: },
    (props.playbackActive//this.state.status_playing
      ? {icon: FaStop_small, label: "Stop", onClick: props.onClick.playAudio}//this.playAudio}
      : {icon: IoMdVolumeHigh, label: "Listen", onClick: props.onClick.playAudio}//this.playAudio}
    ),
    {icon: FaDownload, label: `Save`, onClick: props.onClick.downloadAudio}//this.downloadAudio},
  ]

  return (
    <ButtonContainer>
      {ButtonProps.map((props, i) => <CircleButton key={i} {...props} /> )}
    </ButtonContainer>
    )
}



// Seperate file/component?
const Options = styled.div`
  position: absolute;
  width: 200px;
  height: 100px;
  bottom: 10px;

  input[type=range] {
    -webkit-appearance: none;
    margin: 20px 0;
    width: 100%;

    &:focus {
      outline: none;
    }

    &::-webkit-slider-runnable-track {
      height: 4px;
      cursor: pointer;
      background-color: #abe2fb;
      border-radius: 6px;
    }

    //thumb/handle
    &::-webkit-slider-thumb {
      border: solid 2px #96dbfa;
      height: 14px;
      width: 14px;
      border-radius: 50%;
      background: #fff;
      cursor: grab; //caniuse? style referring to uses pointer and webkit-grab as fallback
      margin-top: -5px;
      touch-action: pan-x; // what is this?
      -webkit-appearance: none;

      &:hover {
        height: 20px;
        width: 20px;
        margin-top: -8px;
      }
    }

    &:focus::-webkit-slider-runnable-track {
      //background: red;//lighten(#424242, 5%);
    }
}
`

//export default Menu
export { Menu, Options }
